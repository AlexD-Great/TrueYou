import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Dashboard from "./dashboard/Dashboard";
import Login from "./auth/Login";
import VerificationRequests from "./verification/VerificationRequests";
import RequestVerification from "./verification/RequestVerification";
import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "./auth/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/verification-requests" element={<VerificationRequests />} />
          <Route path="/request-verification" element={<RequestVerification />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
