import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const res = await axios.post(endpoint, { username, password });

            if (isLogin) {
                login(res.data.token);
                navigate('/');
            } else {
                // Auto login after register
                const loginRes = await axios.post('/api/auth/login', { username, password });
                login(loginRes.data.token);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper sx={{ p: 4, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Typography component="h1" variant="h5" fontWeight="bold">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </Typography>
                {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, height: 48 }}
                    >
                        {isLogin ? 'Login' : 'Sign Up'}
                    </Button>
                    <Button
                        fullWidth
                        variant="text"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default LoginPage;
