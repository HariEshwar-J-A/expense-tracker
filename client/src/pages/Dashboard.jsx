import { useEffect, useRef, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    useTheme,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    InputAdornment,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";
import axios from "axios";
import * as d3 from "d3";
import AttachMoney from "@mui/icons-material/AttachMoney";
import ShowChart from "@mui/icons-material/ShowChart";
import Category from "@mui/icons-material/Category";
import Store from "@mui/icons-material/Store";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import CalendarToday from "@mui/icons-material/CalendarToday";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const Dashboard = () => {
    const theme = useTheme();
    const { primaryColor } = useThemeContext();
    const { user, updateUser } = useAuth(); // Moved here
    const [stats, setStats] = useState(null);
    const [period, setPeriod] = useState("monthly"); // Local state for toggle
    const pieRef = useRef();
    const barRef = useRef();

    // Sync local period with user preference on load
    useEffect(() => {
        if (user?.budgetPeriod) {
            setPeriod(user.budgetPeriod);
        }
    }, [user?.budgetPeriod]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch stats for the selected period
                const res = await axios.get(`/api/expenses/stats?period=${period}`);
                const backendStats = res.data;

                // Transform backend stats format to match frontend expectations
                const transformedStats = {
                    kpis: {
                        totalSpend: parseFloat(backendStats.total.amount),
                        avgTransaction:
                            backendStats.total.count > 0
                                ? parseFloat(backendStats.total.amount) /
                                backendStats.total.count
                                : 0,
                        topCategory:
                            backendStats.byCategory.length > 0
                                ? {
                                    name: backendStats.byCategory[0].category,
                                    amount: parseFloat(backendStats.byCategory[0].total),
                                }
                                : { name: "N/A", amount: 0 },
                        topVendor: backendStats.topVendor
                            ? {
                                name: backendStats.topVendor.vendor,
                                amount: parseFloat(backendStats.topVendor.total),
                            }
                            : { name: "N/A", amount: 0 },
                    },
                    // Convert byCategory array to object for D3
                    categoryStats: backendStats.byCategory.reduce((acc, cat) => {
                        acc[cat.category] = parseFloat(cat.total);
                        return acc;
                    }, {}),
                    // Use monthlyTrend data (backend returns last 6 months)
                    dailyStats: backendStats.monthlyTrend.reduce((acc, month) => {
                        acc[month.month] = parseFloat(month.total);
                        return acc;
                    }, {}),
                };

                setStats(transformedStats);
            } catch (error) {
                console.error("Error fetching stats", error);
            }
        };
        fetchStats();
    }, [period]);

    useEffect(() => {
        if (!stats) return;

        drawPieChart(stats.categoryStats);
        drawBarChart(stats.dailyStats);
        // Additional charts can be added here
    }, [stats, theme.palette.mode, primaryColor]);

    const drawPieChart = (data) => {
        const svg = d3.select(pieRef.current);
        svg.selectAll("*").remove();

        const width = 700;
        const height = 600;
        const margin = 50;
        const radius = Math.min(width, height) / 2 - margin;

        const g = svg
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("width", "100%")
            .style("height", "auto")
            .append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        const color = d3
            .scaleOrdinal()
            .domain(Object.keys(data))
            .range(d3.schemeSet2);

        const pie = d3
            .pie()
            .value((d) => d[1])
            .sort(null); // Keep order consistent

        const data_ready = pie(Object.entries(data));

        const arc = d3
            .arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius * 0.8);

        const outerArc = d3
            .arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);

        // Tooltip
        const tooltip = d3
            .select("body")
            .append("div")
            .style("position", "absolute")
            .style("background", theme.palette.background.paper)
            .style("padding", "8px")
            .style("border", `1px solid ${theme.palette.divider}`)
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("box-shadow", theme.shadows[2])
            .style("z-index", 10);

        // Slices with animation
        const slices = g
            .selectAll("path")
            .data(data_ready)
            .enter()
            .append("path")
            .attr("fill", (d) => color(d.data[0]))
            .attr("stroke", theme.palette.background.paper)
            .style("stroke-width", "2px")
            .style("opacity", 0.8)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("d", d3.arc().innerRadius(radius * 0.5).outerRadius(radius * 0.85)) // Slight expansion
                    .style("opacity", 1);

                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip
                    .html(
                        `<strong>${d.data[0]}</strong><br/>$${d.data[1].toFixed(2)}`
                    )
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", function (d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("d", arc)
                    .style("opacity", 0.8);

                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Entry Animation
        slices
            .transition()
            .duration(1000)
            .attrTween("d", function (d) {
                const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                return function (t) {
                    d.endAngle = i(t);
                    return arc(d);
                };
            });

        // --- Label Spacing & Collision Avoidance ---
        // 1. Calculate nominal positions
        const labels = data_ready.map(d => {
            const pos = outerArc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 1.05 * (midAngle < Math.PI ? 1 : -1);
            return { d, pos, midAngle };
        });

        // 2. Separate into left/right groups for sorting
        const rightLabels = labels.filter(l => l.midAngle < Math.PI);
        const leftLabels = labels.filter(l => l.midAngle >= Math.PI);

        // 3. Spacing Logic
        const LABEL_HEIGHT = 20; // Minimum vertical gap pixels
        const relax = (group) => {
            // Sort by Y position
            group.sort((a, b) => a.pos[1] - b.pos[1]);

            // Push overlapping labels apart
            for (let i = 0; i < group.length; i++) {
                if (i > 0) {
                    const prev = group[i - 1];
                    const curr = group[i];
                    if (curr.pos[1] - prev.pos[1] < LABEL_HEIGHT) {
                        // Push current label down
                        curr.pos[1] = prev.pos[1] + LABEL_HEIGHT;
                    }
                }
            }
        }

        relax(rightLabels);
        relax(leftLabels);

        // Draw Labels
        g.selectAll("text")
            .data(labels)
            .enter()
            .append("text")
            .text(l => l.d.data[0])
            .attr("transform", l => `translate(${l.pos})`)
            .style("text-anchor", l => (l.midAngle < Math.PI ? "start" : "end"))
            .style("font-size", "12px")
            .style("fill", theme.palette.text.primary)
            .style("opacity", 0)
            .transition()
            .delay(800)
            .duration(500)
            .style("opacity", 1);

        // Draw Polylines
        g.selectAll("polyline")
            .data(labels)
            .enter()
            .append("polyline")
            .attr("stroke", theme.palette.text.secondary)
            .style("fill", "none")
            .attr("stroke-width", 1)
            .attr("points", l => {
                const posA = arc.centroid(l.d);
                const posB = outerArc.centroid(l.d);
                const posC = [...l.pos]; // Use calculated position

                // Adjust elbow to ensure the horizontal line connects cleanly
                // We keep posB on the arc, so the line B->C might slant if C was pushed down.
                posC[0] = radius * 0.95 * (l.midAngle < Math.PI ? 1 : -1);

                return [posA, posB, posC];
            })
            .style("opacity", 0)
            .transition()
            .delay(800)
            .duration(500)
            .style("opacity", 0.5);
    };

    const drawBarChart = (data) => {
        const svg = d3.select(barRef.current);
        svg.selectAll("*").remove();

        const dataArray = Object.entries(data)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));

        if (dataArray.length === 0) return;

        const margin = { top: 30, right: 30, bottom: 50, left: 50 };
        const totalWidth = 500;
        const totalHeight = 300;
        const width = totalWidth - margin.left - margin.right;
        const height = totalHeight - margin.top - margin.bottom;

        // Define Gradient
        const defs = svg.append("defs");
        const gradient = defs
            .append("linearGradient")
            .attr("id", "barGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        gradient
            .append("stop")
            .attr("offset", "0%")
            .attr("stop-color", theme.palette.primary.main)
            .attr("stop-opacity", 0.9);

        gradient
            .append("stop")
            .attr("offset", "100%")
            .attr("stop-color", theme.palette.primary.light)
            .attr("stop-opacity", 0.4);

        const g = svg
            .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
            .style("width", "100%")
            .style("height", "auto")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3
            .scaleBand()
            .range([0, width])
            .domain(dataArray.map((d) => d.date))
            .padding(0.3);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(dataArray, (d) => d.amount) * 1.1 || 100]) // Add 10% headroom
            .range([height, 0]);

        // Draw X Axis
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("fill", theme.palette.text.secondary)
            .style("font-size", "12px")
            .style("font-weight", "500");

        // Draw Y Axis
        g.append("g")
            .call(d3.axisLeft(y).ticks(5))
            .selectAll("text")
            .style("fill", theme.palette.text.secondary)
            .style("font-size", "11px");

        // Tooltip container (invisible by default)
        const tooltip = d3
            .select("body")
            .append("div")
            .style("position", "absolute")
            .style("background", theme.palette.background.paper)
            .style("padding", "8px")
            .style("border", `1px solid ${theme.palette.divider}`)
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("box-shadow", theme.shadows[2]);

        // Bars
        const bars = g.selectAll(".bar").data(dataArray).enter().append("rect");

        bars
            .attr("class", "bar")
            .attr("x", (d) => x(d.date))
            .attr("width", x.bandwidth())
            .attr("rx", 6) // Rounded corners top
            .attr("fill", "url(#barGradient)")
            // Initial state for animation (height 0)
            .attr("y", height)
            .attr("height", 0)
            .on("mouseover", function (event, d) {
                d3.select(this).attr("opacity", 0.8);
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip
                    .html(`<strong>${d.date}</strong><br/>$${d.amount.toFixed(2)}`)
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("opacity", 1);
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Animation
        bars
            .transition()
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr("y", (d) => y(d.amount))
            .attr("height", (d) => height - y(d.amount));

        // Labels on top of bars
        g.selectAll(".label")
            .data(dataArray)
            .enter()
            .append("text")
            .text((d) => `$${d.amount.toFixed(0)}`)
            .attr("x", (d) => x(d.date) + x.bandwidth() / 2)
            .attr("y", height) // Start at bottom for animation
            .attr("text-anchor", "middle")
            .style("fill", theme.palette.text.primary)
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .style("opacity", 0)
            .transition()
            .delay(200) // Delay slightly after bar starts
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr("y", (d) => y(d.amount) - 5) // Position above bar
            .style("opacity", 1);
    };

    // --- Visual Components ---

    const SafeToSpendGauge = ({ safe, budget, periodLabel }) => {
        // Zero State Handling
        if (!budget || budget === 0) {
            return (
                <Paper elevation={3} sx={{ p: 3, borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <AttachMoney sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No Budget Set</Typography>
                    <Typography variant="body2" color="text.disabled" align="center">
                        Set a budget to see your Safe-to-Spend limit.
                    </Typography>
                </Paper>
            );
        }

        const percentage = Math.min(100, Math.max(0, (safe / budget) * 100));
        const color = percentage < 20 ? "#ff4d4d" : percentage < 50 ? "#ff9800" : "#00e676";

        // Simple Semi-Circle Gauge using CSS/SVG
        return (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Typography variant="h2" fontSize="1.5rem" color="text.primary" gutterBottom>
                    Safe to Spend
                </Typography>
                <Box sx={{ position: 'relative', width: 200, height: 100, overflow: 'hidden', mb: 2 }}>
                    <Box sx={{
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        border: '20px solid ' + theme.palette.action.hover,
                        borderBottomColor: 'transparent',
                        borderRightColor: 'transparent',
                        transform: 'rotate(135deg)', // Base background arc
                        position: 'absolute'
                    }} />
                    <Box sx={{
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        border: '20px solid ' + color,
                        borderBottomColor: 'transparent',
                        borderRightColor: 'transparent',
                        transform: `rotate(${135 + (1.8 * percentage)}deg)`, // Dynamic arc
                        transition: 'transform 1s ease-out',
                        position: 'absolute',
                        zIndex: 2
                    }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color }}>
                    ${safe.toFixed(0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    ${budget.toFixed(0)} {periodLabel} Budget
                </Typography>
            </Paper>
        );
    };

    const VelocityWidget = ({ velocity, budget, totalSpent, daysInPeriod, currentDay, periodLabel }) => {
        // Zero State Handling
        if (!budget || budget === 0) {
            return (
                <Paper elevation={3} sx={{ p: 3, borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <ShowChart sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No Velocity Data</Typography>
                    <Typography variant="body2" color="text.disabled" align="center">
                        Add a budget to track your spending speed.
                    </Typography>
                </Paper>
            );
        }

        const percentUsed = Math.min(100, (totalSpent / budget) * 100);
        const percentTime = Math.min(100, (currentDay / daysInPeriod) * 100);

        return (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h2" fontSize="1.5rem" color="text.primary">Spending Velocity</Typography>
                    <Typography variant="h3" fontSize="1.25rem" fontWeight="bold" color={velocity > budget ? "error.main" : "success.main"}>
                        {velocity > budget ? "Trending High" : "On Track"}
                    </Typography>
                </Box>

                <Box sx={{ position: 'relative', height: 40, bgcolor: theme.palette.action.hover, borderRadius: 20, mb: 1, overflow: 'hidden' }}>
                    {/* Progress Bar */}
                    <Box sx={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: `${percentUsed}%`,
                        bgcolor: theme.palette.primary.main,
                        transition: 'width 1s'
                    }} />

                    {/* Expected Marker line */}
                    <Box sx={{
                        position: 'absolute', left: `${percentTime}%`, top: 0, bottom: 0,
                        borderLeft: `3px dashed ${theme.palette.text.primary}`,
                        zIndex: 2
                    }} />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                    <Typography variant="caption">$0</Typography>
                    <Typography variant="caption" fontWeight="bold">Current: ${totalSpent.toFixed(0)}</Typography>
                    <Typography variant="caption">Budget: ${budget.toFixed(0)}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                    Projected {periodLabel}-End: <strong>${velocity.toFixed(0)}</strong>
                </Typography>
            </Paper>
        );
    };

    // --- NEW: Budget & Analytics Logic ---
    const [openBudgetDialog, setOpenBudgetDialog] = useState(false);
    const [budgetInput, setBudgetInput] = useState("");
    const [activeSlide, setActiveSlide] = useState(0);
    const budgetInitialized = useRef(false);

    useEffect(() => {
        if (user && typeof user.monthlyBudget === 'number' && !budgetInitialized.current) {
            setBudgetInput(user.monthlyBudget.toString());
            budgetInitialized.current = true;
        }
    }, [user]);

    useEffect(() => {
        if (user && user.monthlyBudget === 0) {
            setOpenBudgetDialog(true);
        }
    }, [user]);

    const handleSaveBudget = async () => {
        const amount = parseFloat(budgetInput);
        if (amount > 0) {
            await updateUser({ monthlyBudget: amount });
            setOpenBudgetDialog(false);
        }
    };

    const handlePeriodChange = async (_event, newPeriod) => {
        if (newPeriod !== null && newPeriod !== period) {
            setPeriod(newPeriod);
            // Persist choice to DB
            await updateUser({ budgetPeriod: newPeriod });
        }
    };

    // Calculate Advanced Metrics
    const today = new Date();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();

    // Yearly calc elements
    const startOfYear = new Date(currentYear, 0, 1);
    const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const daysInYear = isLeapYear ? 366 : 365;

    const totalSpent = stats?.kpis?.totalSpend || 0;

    // Determine Budget & Timeframe based on selected period
    const effectiveBudget = period === 'yearly' ? (user?.monthlyBudget || 0) * 12 : (user?.monthlyBudget || 0);
    const daysInPeriod = period === 'yearly' ? daysInYear : daysInMonth;
    const currentDay = period === 'yearly' ? dayOfYear : dayOfMonth;
    const periodLabel = period === 'yearly' ? 'Annual' : 'Monthly';

    const safeToSpend = Math.max(0, effectiveBudget - totalSpent);
    const spendVelocity = currentDay > 0 ? (totalSpent / currentDay) * daysInPeriod : 0;

    // Metrics for Carousel (Simplified - Standard Stats Only)
    const metricSlides = [
        {
            title: "Total Spending",
            value: `$${totalSpent.toFixed(2)}`,
            subtext: `This ${period === 'yearly' ? 'Year' : 'Month'}`,
            icon: <AttachMoney sx={{ fontSize: 40 }} />,
            color: theme.palette.primary.main
        },
        {
            title: "Top Category",
            value: stats?.kpis?.topCategory?.name || "N/A",
            subtext: `$${stats?.kpis?.topCategory?.amount?.toFixed(2) || "0.00"}`,
            icon: <Category sx={{ fontSize: 40 }} />,
            color: theme.palette.secondary.main
        },
        {
            title: "Top Vendor",
            value: stats?.kpis?.topVendor?.name || "N/A",
            subtext: `$${stats?.kpis?.topVendor?.amount?.toFixed(2) || "0.00"}`,
            icon: <Store sx={{ fontSize: 40 }} />,
            color: theme.palette.info.main
        },
        {
            title: "Avg Transaction",
            value: `$${stats?.kpis?.avgTransaction?.toFixed(2) || "0.00"}`,
            subtext: "Per purchase",
            icon: <ShowChart sx={{ fontSize: 40 }} />,
            color: theme.palette.warning.main
        }
    ];

    // Auto-play Carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % metricSlides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [metricSlides.length]);

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                mb: 3
            }}>
                <Typography variant="h1" fontSize="2.5rem" fontWeight="bold">
                    Dashboard
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        onClick={() => setOpenBudgetDialog(true)}
                        startIcon={<AttachMoney />}
                    >
                        {user?.monthlyBudget > 0 ? "Edit Budget" : "Set Budget"}
                    </Button>

                    <ToggleButtonGroup
                        value={period}
                        exclusive
                        onChange={handlePeriodChange}
                        aria-label="budget period"
                        size="small"
                    >
                        <ToggleButton value="monthly" aria-label="monthly">
                            <CalendarMonth sx={{ mr: 1 }} /> Month
                        </ToggleButton>
                        <ToggleButton value="yearly" aria-label="yearly">
                            <CalendarToday sx={{ mr: 1 }} /> Year
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            {/* Top Row: Persistent Analytics Widgets */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <SafeToSpendGauge safe={safeToSpend} budget={effectiveBudget} periodLabel={periodLabel} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <VelocityWidget
                        velocity={spendVelocity}
                        budget={effectiveBudget}
                        totalSpent={totalSpent}
                        daysInPeriod={daysInPeriod}
                        currentDay={currentDay}
                        periodLabel={periodLabel}
                    />
                </Grid>
            </Grid>

            {/* Middle Row: Quick Stats Carousel */}
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                    position: "relative",
                    overflow: "hidden",
                    minHeight: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                {metricSlides.map((slide, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: activeSlide === index ? "flex" : "none",
                            flexDirection: "column",
                            alignItems: "center",
                            animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                            "@keyframes slideUp": {
                                "0%": { opacity: 0, transform: "translateY(20px)" },
                                "100%": { opacity: 1, transform: "translateY(0)" }
                            },
                            textAlign: 'center',
                            width: '100%'
                        }}
                    >
                        <Box sx={{ color: slide.color, mb: 0.5 }}>{slide.icon}</Box>
                        <Typography variant="overline" color="text.secondary" letterSpacing={1.5}>
                            {slide.title}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: slide.color, my: 0.5 }}>
                            {slide.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {slide.subtext}
                        </Typography>
                    </Box>
                ))}

                {/* Carousel Indicators */}
                <Box sx={{ position: "absolute", bottom: 12, display: "flex", gap: 1 }}>
                    {metricSlides.map((_, index) => (
                        <Box
                            key={index}
                            onClick={() => setActiveSlide(index)}
                            sx={{
                                width: activeSlide === index ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: activeSlide === index ? 'primary.main' : 'action.disabled',
                                cursor: 'pointer',
                                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                            }}
                        />
                    ))}
                </Box>
            </Paper>

            {/* Budget Dialog */}
            <Dialog open={openBudgetDialog} onClose={() => setOpenBudgetDialog(false)}>
                <DialogTitle>Set Monthly Spendable Income</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Enter your total monthly budget to unlock "Safe-to-Spend" and "Velocity" insights.
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Monthly Budget ($)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveBudget();
                        }}
                        slotProps={{
                            input: { startAdornment: <InputAdornment position="start">$</InputAdornment> }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBudgetDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveBudget} variant="contained">Save Budget</Button>
                </DialogActions>
            </Dialog>


            {/* Charts Row */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                        sx={{
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            height: "100%",
                            minHeight: 400,
                            borderRadius: 4
                        }}
                    >
                        <Typography variant="h2" fontSize="1.5rem" gutterBottom>
                            Spending by Category
                        </Typography>
                        <svg ref={pieRef}></svg>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                        sx={{
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            height: "100%",
                            minHeight: 400,
                            borderRadius: 4
                        }}
                    >
                        <Typography variant="h2" fontSize="1.5rem" gutterBottom>
                            Monthly Trends (Last 6 Months)
                        </Typography>
                        <svg ref={barRef} style={{ width: "100%", height: "auto" }}></svg>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
