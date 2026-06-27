import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "@palmier/ui/theme.css";
import "./index.css";
import { App } from "./App";
import { useTheme } from "@palmier/ui";

// Push initial theme vars onto :root before first paint.
useTheme.getState().apply();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
