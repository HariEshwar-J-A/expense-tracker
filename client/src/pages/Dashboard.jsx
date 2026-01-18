import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper, Grid, useTheme, Card, CardContent } from '@mui/material';
import { useThemeContext } from '../context/ThemeContext';
import axios from 'axios';
import * as d3 from 'd3';
import { AttachMoney, ShowChart, Category, Store } from '@mui/icons-material';

const Dashboard = () => {
    const theme = useTheme();
    const { primaryColor } = useThemeContext();
    const [stats, setStats] = useState(null);
    const pieRef = useRef();
    const barRef = useRef();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/expenses/stats');
                const backendStats = res.data;

                // Transform backend stats format to match frontend expectations
                const transformedStats = {
                    kpis: {
                        totalSpend: parseFloat(backendStats.total.amount),
                        avgTransaction: backendStats.total.count > 0
                            ? parseFloat(backendStats.total.amount) / backendStats.total.count
                            : 0,
                        topCategory: backendStats.byCategory.length > 0
                            ? { name: backendStats.byCategory[0].category, amount: parseFloat(backendStats.byCategory[0].total) }
                            : { name: 'N/A', amount: 0 },
                        topVendor: backendStats.topVendor
                            ? { name: backendStats.topVendor.vendor, amount: parseFloat(backendStats.topVendor.total) }
                            : { name: 'N/A', amount: 0 }
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
                    }, {})
                };

                setStats(transformedStats);
            } catch (error) {
                console.error('Error fetching stats', error);
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
        svg.selectAll('*').remove();

        const width = 300;
        const height = 300;
        const radius = Math.min(width, height) / 2;

        const g = svg.attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        const color = d3.scaleOrdinal()
            .domain(Object.keys(data))
            .range(d3.schemeSet2);

        const pie = d3.pie().value(d => d[1]);
        const data_ready = pie(Object.entries(data));

        const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius * 0.8);

        g.selectAll('path')
            .data(data_ready)
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data[0]))
            .attr('stroke', theme.palette.background.paper)
            .style('stroke-width', '2px')
            .style('opacity', 0.8)
            .on('mouseover', function (d) { d3.select(this).style('opacity', 1); })
            .on('mouseout', function (d) { d3.select(this).style('opacity', 0.8); });

        // Labels
        const outerArc = d3.arc().innerRadius(radius * 0.9).outerRadius(radius * 0.9);
        g.selectAll('text')
            .data(data_ready)
            .enter()
            .append('text')
            .text(d => d.data[0])
            .attr('transform', d => `translate(${outerArc.centroid(d)})`)
            .style('text-anchor', 'middle')
            .style('font-size', 12)
            .style('fill', theme.palette.text.primary);
    };

    const drawBarChart = (data) => {
        const svg = d3.select(barRef.current);
        svg.selectAll('*').remove();

        const dataArray = Object.entries(data)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));

        if (dataArray.length === 0) return;

        const margin = { top: 20, right: 30, bottom: 40, left: 40 };
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const g = svg.attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .range([0, width])
            .domain(dataArray.map(d => d.date))
            .padding(0.2);

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('fill', theme.palette.text.secondary);

        const y = d3.scaleLinear()
            .domain([0, d3.max(dataArray, d => d.amount) || 100])
            .range([height, 0]);

        g.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', theme.palette.text.secondary);

        g.selectAll('rect')
            .data(dataArray)
            .enter()
            .append('rect')
            .attr('x', d => x(d.date))
            .attr('y', d => y(d.amount))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.amount))
            .attr('fill', theme.palette.primary.main)
            .attr('rx', 4);
    };

    const KPICard = ({ title, value, icon, subtext }) => (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: theme.palette.primary.main }}>
                    {icon}
                </Box>
                <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{title}</Typography>
                    <Typography variant="h5" fontWeight={700}>{value}</Typography>
                    {subtext && <Typography variant="caption" color="text.secondary">{subtext}</Typography>}
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Dashboard</Typography>

            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Total Spending"
                        value={`$${stats?.kpis?.totalSpend?.toFixed(2) || '0.00'}`}
                        icon={<AttachMoney />}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Avg Transaction"
                        value={`$${stats?.kpis?.avgTransaction?.toFixed(2) || '0.00'}`}
                        icon={<ShowChart />}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Top Category"
                        value={stats?.kpis?.topCategory?.name || 'N/A'}
                        subtext={`$${stats?.kpis?.topCategory?.amount?.toFixed(2) || '0.00'}`}
                        icon={<Category />}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Top Vendor"
                        value={stats?.kpis?.topVendor?.name || 'N/A'}
                        subtext={`$${stats?.kpis?.topVendor?.amount?.toFixed(2) || '0.00'}`}
                        icon={<Store />}
                    />
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 400 }}>
                        <Typography variant="h6" gutterBottom>Spending by Category</Typography>
                        <svg ref={pieRef}></svg>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 400 }}>
                        <Typography variant="h6" gutterBottom>Monthly Trends (Last 6 Months)</Typography>
                        <svg ref={barRef} style={{ width: '100%', height: 'auto' }}></svg>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
