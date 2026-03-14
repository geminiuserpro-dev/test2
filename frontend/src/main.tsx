import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WorkspacePage from "./pages/WorkspacePage";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<WorkspacePage />} />
                <Route path="/*" element={<WorkspacePage />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);