// ============================================================================
// Entry point — khởi tạo Amplify, bọc AuthProvider, render App.
// ============================================================================
import React from "react";
import ReactDOM from "react-dom/client";
import { configureAmplify } from "./config/amplify";
import { AuthProvider } from "./auth/AuthContext";
import App from "./App";
import "./index.css";

// Cấu hình Amplify (Cognito) trước khi render.
configureAmplify();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
