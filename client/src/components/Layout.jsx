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
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              component="div"
              sx={{
                mr: 4,
                fontWeight: 700,
                background:
                  "-webkit-linear-gradient(45deg, #6C63FF 30%, #FF6584 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ExpenseTracker
            </Typography>

            <Box sx={{ flexGrow: 1, display: "flex", gap: 1 }}>
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
