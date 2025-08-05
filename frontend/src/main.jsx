import React from "react";
import ReactDOM from "react-dom/client";
import AnalytiCore from "./page.tsx"; // ✅ Importa tu nuevo diseño
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AnalytiCore /> {/* ✅ Renderiza el diseño con backend funcional */}
  </React.StrictMode>
);
