import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import Page from "./app/(index)/page";
import "./app/globals.css";
import { initializeGoogleAnalytics } from "./lib/analytics";

initializeGoogleAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
