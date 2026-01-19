import { useEffect, useState } from "react";
import { Paper, Typography, Box, Button } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import TrendingUp from "@mui/icons-material/TrendingUp";
import axios from "axios";

const BudgetHistoryWidget = () => {
    const [trendData, setTrendData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrend();
    }, []);

    const fetchTrend = async () => {
        try {
            const res = await axios.get("/api/budget-history/trend?months=6");
            setTrendData(res.data);
        } catch (error) {
            console.error("Error fetching budget trend:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Paper sx={{ p: 2, height: "100%" }}>
                <Typography>Loading...</Typography>
            </Paper>
        );
    }

    if (!trendData || trendData.count === 0) {
        return (
            <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                    Income History
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                    No budget changes recorded yet. Update your budget to start tracking.
                </Typography>
            </Paper>
        );
    }

    // Transform data for chart
    const chartData = trendData.trend.map((record) => ({
        date: new Date(record.effectiveDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount: record.amount,
        fullDate: record.effectiveDate,
        reason: record.reason
    }));

    const currentBudget = trendData.trend[trendData.trend.length - 1]?.amount || 0;
    const previousBudget = trendData.trend.length > 1 ? trendData.trend[trendData.trend.length - 2]?.amount : 0;
    const change = currentBudget - previousBudget;
    const changePercent = previousBudget > 0 ? ((change / previousBudget) * 100).toFixed(1) : 0;

    return (
        <Paper sx={{ p: 2, height: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Income History</Typography>
                <Button size="small" href="#budget-timeline">View All</Button>
            </Box>

            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        formatter={(value) => `$${value.toFixed(2)}`}
                        labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0) {
                                const reason = payload[0].payload.reason;
                                return `${payload[0].payload.fullDate}${reason ? ` - ${reason}` : ''}`;
                            }
                            return label;
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>

            <Box sx={{ mt: 2, display: "flex", gap: 3 }}>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Current Budget
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                        ${currentBudget.toFixed(0)}
                    </Typography>
                </Box>

                {change !== 0 && (
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Change
                        </Typography>
                        <Typography
                            variant="h6"
                            fontWeight="bold"
                            color={change > 0 ? "success.main" : "error.main"}
                        >
                            {change > 0 ? "+" : ""}${change.toFixed(0)} ({changePercent > 0 ? "+" : ""}{changePercent}%)
                        </Typography>
                    </Box>
                )}

                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Avg (6mo)
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                        ${trendData.average.toFixed(0)}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default BudgetHistoryWidget;
