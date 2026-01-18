import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  IconButton,
} from "@mui/material";
import { useThemeContext } from "../context/ThemeContext";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

const COLORS = [
  "#6C63FF", // Indigo
  "#FF6584", // Pink
  "#2ECA45", // Green
  "#FFC107", // Amber
  "#00BCD4", // Cyan
  "#9C27B0", // Purple
];

const Settings = () => {
  const { mode, toggleColorMode, primaryColor, setPrimaryColor } =
    useThemeContext();

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 4, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Appearance
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Theme Mode
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Switch between light and dark backgrounds.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Button
              variant="outlined"
              startIcon={
                mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />
              }
              onClick={toggleColorMode}
              sx={{ minWidth: 150 }}
            >
              {mode === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Accent Color
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose your personalized dashboard color.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {COLORS.map((color) => (
                <IconButton
                  key={color}
                  onClick={() => setPrimaryColor(color)}
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: color,
                    border: primaryColor === color ? "3px solid white" : "none",
                    boxShadow:
                      primaryColor === color ? "0 0 0 2px " + color : "none",
                    "&:hover": { backgroundColor: color, opacity: 0.8 },
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Settings;
