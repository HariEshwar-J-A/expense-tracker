import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container, IconButton, Button, Switch } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dashboard as DashboardIcon, Receipt as ReceiptIcon, Logout as LogoutIcon } from '@mui/icons-material';

const Layout = ({ children, toggleColorMode, mode }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Container maxWidth="md">
                    <Toolbar disableGutters>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, background: '-webkit-linear-gradient(45deg, #6C63FF 30%, #FF6584 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            ExpenseTracker
                        </Typography>

                        <Switch checked={mode === 'dark'} onChange={toggleColorMode} />

                        <IconButton onClick={logout} color="primary">
                            <LogoutIcon />
                        </IconButton>
                    </Toolbar>
                    <Box sx={{ display: 'flex', gap: 2, pb: 2 }}>
                        <Button
                            startIcon={<DashboardIcon />}
                            color={location.pathname === '/' ? 'primary' : 'inherit'}
                            onClick={() => navigate('/')}
                            variant={location.pathname === '/' ? 'soft' : 'text'}
                        >
                            Dashboard
                        </Button>
                        <Button
                            startIcon={<ReceiptIcon />}
                            color={location.pathname === '/expenses' ? 'primary' : 'inherit'}
                            onClick={() => navigate('/expenses')}
                        >
                            Expenses
                        </Button>
                    </Box>
                </Container>
            </AppBar>
            <Container maxWidth="md" sx={{ flexGrow: 1, py: 4 }}>
                {children}
            </Container>
        </Box>
    );
};

export default Layout;
