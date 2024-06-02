import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App.tsx";

// Import our custom CSS
import "../src/styles/scss/styles.scss";

import "./styles/index.css";

// Import all of Bootstrap's JS
//import * as bootstrap from "bootstrap";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
