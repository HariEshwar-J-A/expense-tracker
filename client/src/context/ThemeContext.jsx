import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import getTheme from '../theme';

const ThemeContext = createContext({
    mode: 'dark',
    primaryColor: '#6C63FF',
    toggleColorMode: () => { },
    setPrimaryColor: () => { },
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeContextProvider = ({ children }) => {
    const [mode, setMode] = useState('dark');
    const [primaryColor, setPrimaryColor] = useState('#6C63FF');

    const toggleColorMode = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const theme = useMemo(() => getTheme(mode, primaryColor), [mode, primaryColor]);

    return (
        <ThemeContext.Provider value={{ mode, primaryColor, toggleColorMode, setPrimaryColor }}>
            <MuiThemeProvider theme={theme}>
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
