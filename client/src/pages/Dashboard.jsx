import { useEffect, useRef, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    useTheme,
    Card,
    CardContent,
} from "@mui/material";
import { useThemeContext } from "../context/ThemeContext";
import axios from "axios";
import * as d3 from "d3";
import { AttachMoney, ShowChart, Category, Store } from "@mui/icons-material";

const Dashboard = () => {
    const theme = useTheme();
    const { primaryColor } = useThemeContext();
    const [stats, setStats] = useState(null);
    const pieRef = useRef();
    const barRef = useRef();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get("/api/expenses/stats");
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
    }, []);

    useEffect(() => {
        if (!stats) return;

        drawPieChart(stats.categoryStats);
        drawBarChart(stats.dailyStats);
        // Additional charts can be added here
    }, [stats, theme.palette.mode, primaryColor]);

    const drawPieChart = (data) => {
        const svg = d3.select(pieRef.current);
        svg.selectAll("*").remove();

        // Significantly increased width to accommodate long labels (e.g. "Entertainment")
        const width = 500;
        const height = 350;
        const margin = 40;
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

        // Smart Labels
        g.selectAll("text")
            .data(data_ready)
            .enter()
            .append("text")
            .text((d) => d.data[0])
            .attr("transform", (d) => {
                const pos = outerArc.centroid(d);
                const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                // Push labels out slightly based on angle to avoid overlap
                pos[0] = radius * 1.05 * (midAngle < Math.PI ? 1 : -1);
                return `translate(${pos})`;
            })
            .style("text-anchor", (d) => {
                const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                return midAngle < Math.PI ? "start" : "end";
            })
            .style("font-size", "12px")
            .style("fill", theme.palette.text.primary)
            .style("opacity", 0)
            .transition()
            .delay(800)
            .duration(500)
            .style("opacity", 1);

        // Lines connecting slices to labels
        g.selectAll("polyline")
            .data(data_ready)
            .enter()
            .append("polyline")
            .attr("stroke", theme.palette.text.secondary)
            .style("fill", "none")
            .attr("stroke-width", 1)
            .attr("points", (d) => {
                const posA = arc.centroid(d); // Line start: center of slice
                const posB = outerArc.centroid(d); // Line break: outer arc
                const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                const posC = outerArc.centroid(d); // Line end: near label
                posC[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
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

    const KPICard = ({ title, value, icon, subtext }) => (
        <Card
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
            }}
        >
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor:
                            theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.05)",
                        color: theme.palette.primary.main,
                    }}
                >
                    {icon}
                </Box>
                <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {title}
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                        {value}
                    </Typography>
                    {subtext && (
                        <Typography variant="caption" color="text.secondary">
                            {subtext}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Dashboard
            </Typography>

            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <KPICard
                        title="Total Spending"
                        value={`$${stats?.kpis?.totalSpend?.toFixed(2) || "0.00"}`}
                        icon={<AttachMoney />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <KPICard
                        title="Avg Transaction"
                        value={`$${stats?.kpis?.avgTransaction?.toFixed(2) || "0.00"}`}
                        icon={<ShowChart />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <KPICard
                        title="Top Category"
                        value={stats?.kpis?.topCategory?.name || "N/A"}
                        subtext={`$${stats?.kpis?.topCategory?.amount?.toFixed(2) || "0.00"}`}
                        icon={<Category />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <KPICard
                        title="Top Vendor"
                        value={stats?.kpis?.topVendor?.name || "N/A"}
                        subtext={`$${stats?.kpis?.topVendor?.amount?.toFixed(2) || "0.00"}`}
                        icon={<Store />}
                    />
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                        sx={{
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            minHeight: 400,
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
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
                            minHeight: 400,
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
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
