/**
 * Application Entry Point
 *
 * Mounts the root React component into the DOM. The #root element
 * is defined in index.html. Global CSS (Tailwind + custom tokens)
 * is imported here so it applies to the entire application.
 */

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
