// Entry point for the build script in your package.json
import "@hotwired/turbo-rails"
import "./controllers"
import * as bootstrap from "bootstrap";

import React from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "./routes";
import { CartProvider } from "./contexts/CartContext";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("root");
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </React.StrictMode>
  );
});