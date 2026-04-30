import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initSentry } from "./lib/sentry";
import { reportVitals } from "./lib/vitals";
import "./index.css";

// Observability bootstrap (no-op when env vars are absent)
initSentry();
reportVitals();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
