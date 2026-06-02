import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "./context/ToastContext.jsx";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.NODE_ENV || "development",
  tracesSampleRate: import.meta.env.NODE_ENV === "production" ? 0.1 : 1.0,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <GoogleOAuthProvider
            clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
            locale="vi"
          >
            <App />
          </GoogleOAuthProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
