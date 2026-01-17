import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
    palette: {
        mode,
        primary: {
            main: '#6C63FF', // Modern Violet/Indigo
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#FF6584', // Vibrant Pink/Red
        },
        background: {
            default: mode === 'dark' ? '#121212' : '#f8f9fa',
            paper: mode === 'dark' ? '#1E1E1E' : '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 500 },
        h6: { fontWeight: 500 },
    },
    shape: {
        borderRadius: 12, // More rounded modern look
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none', // No uppercase caps
                    fontWeight: 600,
                    borderRadius: 8,
                    padding: '8px 16px',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // Remove default elevation overlay in dark mode for cleaner look
                },
                rounded: {
                    boxShadow: mode === 'light'
                        ? '0px 4px 20px rgba(0, 0, 0, 0.05)'
                        : '0px 4px 20px rgba(0, 0, 0, 0.4)', // Soft dropshadow
                }
            },
        },
        MuiSwitch: {
            styleOverrides: {
                root: {
                    width: 42,
                    height: 26,
                    padding: 0,
                },
                switchBase: {
                    padding: 0,
                    margin: 2,
                    transitionDuration: '300ms',
                    '&.Mui-checked': {
                        transform: 'translateX(16px)',
                        color: '#fff',
                        '& + .MuiSwitch-track': {
                            backgroundColor: mode === 'dark' ? '#2ECA45' : '#65C466',
                            opacity: 1,
                            border: 0,
                        },
                        '&.Mui-disabled + .MuiSwitch-track': {
                            opacity: 0.5,
                        },
                    },
                    '&.Mui-focusVisible .MuiSwitch-thumb': {
                        color: '#33cf4d',
                        border: '6px solid #fff',
                    },
                },
                thumb: {
                    boxSizing: 'border-box',
                    width: 22,
                    height: 22,
                },
                track: {
                    borderRadius: 26 / 2,
                    backgroundColor: mode === 'light' ? '#E9E9EA' : '#39393D',
                    opacity: 1,
                    transition: createTheme().transitions.create(['background-color'], {
                        duration: 500,
                    }),
                },
            },
        },
    },
});

export default getTheme;
