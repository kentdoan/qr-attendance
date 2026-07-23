import React from "react";
import ReactDOM from "react-dom/client";
import { configureAmplify } from "./config/amplify";
import { AuthProvider } from "./auth/AuthContext";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App";
import "./index.css";

configureAmplify();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </React.StrictMode>,
);
