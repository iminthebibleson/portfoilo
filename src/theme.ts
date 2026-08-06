import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",

    background: {
      default: "#0f0f12",
      paper: "#1b1b20",
    },

    primary: {
      main: "#b8c7ff",
    },
  },

  shape: {
    borderRadius: 28,
  },

  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },
});

export default theme;