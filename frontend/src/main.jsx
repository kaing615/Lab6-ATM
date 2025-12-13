import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import axios from "axios";
import "./styles.css";

axios.defaults.baseURL = "http://localhost:4000";
axios.defaults.timeout = 10 * 60 * 1000;

createRoot(document.getElementById("root")).render(<App />);
