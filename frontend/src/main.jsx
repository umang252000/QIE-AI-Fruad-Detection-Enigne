import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";

// Get root element safely
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Root element #root not found in index.html");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);