import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper, Grid, useTheme } from '@mui/material';
import axios from 'axios';
import * as d3 from 'd3';

const Dashboard = () => {
    const theme = useTheme();
    const [stats, setStats] = useState(null);
    const pieRef = useRef();
    const barRef = useRef();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/expenses/stats');
                setStats(res.data);
            } catch (error) {
                console.error('Error fetching stats', error);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        if (!stats) return;

        // Draw Pie Chart
        drawPieChart(stats.categoryStats);

        // Draw Bar Chart
        drawBarChart(stats.dailyStats);

    }, [stats, theme.palette.mode]);

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

        const pie = d3.pie()
            .value(d => d[1]);

        const data_ready = pie(Object.entries(data));

        const arc = d3.arc()
            .innerRadius(radius * 0.5) // Donut chart
            .outerRadius(radius * 0.8);

        g.selectAll('path')
            .data(data_ready)
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data[0]))
            .attr('stroke', theme.palette.background.paper)
            .style('stroke-width', '2px')
            .style('opacity', 0.8)
            .on('mouseover', function (d) {
                d3.select(this).style('opacity', 1);
            })
            .on('mouseout', function (d) {
                d3.select(this).style('opacity', 0.8);
            });

        // Add labels
        const outerArc = d3.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);

        g.selectAll('text')
            .data(data_ready)
            .enter()
            .append('text')
            .text(d => `${d.data[0]}`)
            .attr('transform', d => `translate(${outerArc.centroid(d)})`)
            .style('text-anchor', 'middle')
            .style('font-size', 12)
            .style('fill', theme.palette.text.primary);
    };

    const drawBarChart = (data) => {
        const svg = d3.select(barRef.current);
        svg.selectAll('*').remove();

        // Convert to array and sort by date
        const dataArray = Object.entries(data)
            .map(([date, amount]) => ({ date: new Date(date), amount }))
            .sort((a, b) => a.date - b.date)
            .slice(-7); // Last 7 active days

        const margin = { top: 20, right: 30, bottom: 40, left: 40 };
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const g = svg.attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // X Axis
        const x = d3.scaleBand()
            .range([0, width])
            .domain(dataArray.map(d => d.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })))
            .padding(0.2);

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('fill', theme.palette.text.secondary);

        // Y Axis
        const y = d3.scaleLinear()
            .domain([0, d3.max(dataArray, d => d.amount) || 100])
            .range([height, 0]);

        g.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', theme.palette.text.secondary);

        // Bars
        g.selectAll('rect')
            .data(dataArray)
            .enter()
            .append('rect')
            .attr('x', d => x(d.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })))
            .attr('y', d => y(d.amount))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.amount))
            .attr('fill', theme.palette.primary.main)
            .attr('rx', 4); // Rounded bars
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Dashboard</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 400 }}>
                        <Typography variant="h6" gutterBottom>Spending by Category</Typography>
                        <svg ref={pieRef}></svg>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 400 }}>
                        <Typography variant="h6" gutterBottom>Daily Trends (Last 7 Days)</Typography>
                        <svg ref={barRef} style={{ width: '100%', height: 'auto' }}></svg>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
