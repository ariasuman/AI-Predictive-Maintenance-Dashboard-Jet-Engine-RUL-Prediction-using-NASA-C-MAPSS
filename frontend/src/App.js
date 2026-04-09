import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import Predict from "./Predict";
import Sensors from "./Sensors";
import Alerts from "./Alerts";
import Maintenance from "./Maintenance";
import Reports from "./Reports";
import ModelPerformance from "./ModelPerformance";

function App() {
  return (
    <Router>
      <div style={{ display: "flex", minHeight: "100vh", background: "#020617" }}>
        <Sidebar />
        <main style={{ marginLeft: "220px", flex: 1, padding: "28px 32px", minHeight: "100vh" }}>
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/predict"    element={<Predict />} />
            <Route path="/sensors"    element={<Sensors />} />
            <Route path="/alerts"     element={<Alerts />} />
            <Route path="/maintenance"element={<Maintenance />} />
            <Route path="/reports"    element={<Reports />} />
            <Route path="/model"      element={<ModelPerformance />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
