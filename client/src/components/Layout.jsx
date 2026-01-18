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
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptIcon from "@mui/icons-material/Receipt";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

const Layout = ({ children }) => {
  const { logout } = useAuth();
  const { mode, toggleColorMode } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          zIndex: 9999,
          padding: "1rem",
          background: "var(--mui-palette-background-paper)",
          color: "var(--mui-palette-primary-main)",
          textDecoration: "none",
        }}
        onFocus={(e) => {
          e.target.style.top = "0";
          e.target.style.left = "0";
          e.target.style.width = "auto";
          e.target.style.height = "auto";
        }}
        onBlur={(e) => {
          e.target.style.top = "-9999px";
          e.target.style.left = "-9999px";
          e.target.style.width = "1px";
          e.target.style.height = "1px";
        }}
      >
        Skip to main content
      </a>
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
                aria-label="Toggle color mode"
                sx={{ mr: 1 }}
              >
                {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>

              <IconButton onClick={logout} color="primary" aria-label="Logout">
                <LogoutIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Container
        id="main-content"
        maxWidth="lg"
        component="main"
        sx={{ flexGrow: 1, py: 4, outline: "none" }}
        tabIndex={-1}
      >
        {children}
      </Container>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: "auto",
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="text.primary">
          © {new Date().getFullYear()} Harieshwar Jagan Abirami. All rights
          reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;
