import { createTheme, alpha } from "@mui/material/styles";

const getTheme = (mode, primaryColor) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: primaryColor,
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#FF6584",
      },
      background: {
        default: mode === "dark" ? "#0A0A0A" : "#F0F2F5",
        paper:
          mode === "dark"
            ? "rgba(30, 30, 30, 0.7)"
            : "rgba(255, 255, 255, 0.7)", // Transparent base
      },
      text: {
        primary: mode === "dark" ? "#E0E0E0" : "#2C3E50",
        secondary: mode === "dark" ? "#A0A0A0" : "#7F8C8D",
      },
    },
    typography: {
      fontFamily: '"Outfit", "Inter", "Roboto", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: "none" },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage:
              mode === "dark"
                ? "radial-gradient(circle at 15% 50%, rgba(108, 99, 255, 0.08), transparent 25%), radial-gradient(circle at 85% 30%, rgba(255, 101, 132, 0.08), transparent 25%)"
                : "radial-gradient(circle at 15% 50%, rgba(108, 99, 255, 0.05), transparent 25%), radial-gradient(circle at 85% 30%, rgba(255, 101, 132, 0.05), transparent 25%)",
            backgroundAttachment: "fixed",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            backgroundImage: "none",
            border: "1px solid",
            borderColor:
              mode === "dark"
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
            boxShadow:
              mode === "dark"
                ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
                : "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            },
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${alpha(primaryColor, 0.8)} 100%)`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor:
              mode === "dark"
                ? "rgba(10, 10, 10, 0.8)"
                : "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid",
            borderColor:
              mode === "dark"
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",
            boxShadow: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            overflow: "visible", // For cool glowing effects
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: "1px solid",
            borderColor:
              mode === "dark"
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",
          },
        },
      },
    },
  });

export default getTheme;
