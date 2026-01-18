import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  IconButton,
  Button,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";

const Layout = ({ children }) => {
  const { logout } = useAuth();
  const { mode, toggleColorMode } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ flexWrap: "wrap" }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                mr: 2,
                flexGrow: { xs: 1, md: 0 }, // Take space on mobile
                fontWeight: 700,
                background:
                  "-webkit-linear-gradient(45deg, #6C63FF 30%, #FF6584 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ExpenseTracker
            </Typography>

            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                gap: 1,
                overflowX: "auto", // Allow scrolling for menu items if super small
                order: { xs: 3, md: 2 }, // Move nav to bottom row on mobile if needed
                width: { xs: "100%", md: "auto" },
                mt: { xs: 1, md: 0 },
                pb: { xs: 1, md: 0 },
              }}
            >
              <Button
                startIcon={<DashboardIcon />}
                color={location.pathname === "/" ? "primary" : "inherit"}
                onClick={() => navigate("/")}
                variant={location.pathname === "/" ? "soft" : "text"}
              >
                Dashboard
              </Button>
              <Button
                startIcon={<ReceiptIcon />}
                color={
                  location.pathname === "/expenses" ? "primary" : "inherit"
                }
                onClick={() => navigate("/expenses")}
                variant={location.pathname === "/expenses" ? "soft" : "text"}
              >
                Expenses
              </Button>
              <Button
                startIcon={<SettingsIcon />}
                color={
                  location.pathname === "/settings" ? "primary" : "inherit"
                }
                onClick={() => navigate("/settings")}
                variant={location.pathname === "/settings" ? "soft" : "text"}
              >
                Settings
              </Button>
            </Box>

            <Box sx={{ display: "flex", order: { xs: 2, md: 3 } }}>
              <IconButton
                onClick={toggleColorMode}
                color="inherit"
                sx={{ mr: 1 }}
              >
                {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>

              <IconButton onClick={logout} color="primary">
                <LogoutIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
