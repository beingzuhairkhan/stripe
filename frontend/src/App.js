// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import CreateCheckout from "./CreateCheckout";
import Success from "./Success";
import Cancel from "./Cancel";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: 20 }}>
        <h2>Stripe Checkout Demo</h2>
        <nav style={{ marginBottom: 20 }}>
          <Link to="/">Home</Link>{" "}
        </nav>
        <Routes>
          <Route path="/" element={<CreateCheckout />} />
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
