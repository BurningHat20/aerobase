import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Apply theme synchronously before first paint — prevents the flash of
// unstyled content when switching between light and dark.
try {
  const t = localStorage.getItem("aerobase-theme");
  // Default to dark; only remove the class if explicitly set to "light"
  if (t === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
} catch {
  document.documentElement.classList.add("dark");
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
