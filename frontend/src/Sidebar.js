import React from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_GROUPS = [
  {
    label: "OVERVIEW",
    items: [
      { to: "/",        icon: "📊", label: "Dashboard" },
      { to: "/predict", icon: "🤖", label: "Predict RUL" },
    ]
  },
  {
    label: "MONITORING",
    items: [
      { to: "/sensors",  icon: "📡", label: "Sensor Data" },
      { to: "/alerts",   icon: "🔔", label: "Alerts" },
    ]
  },
  {
    label: "OPERATIONS",
    items: [
      { to: "/maintenance", icon: "🔧", label: "Maintenance" },
      { to: "/reports",     icon: "📋", label: "Reports & Logs" },
    ]
  },
  {
    label: "ANALYTICS",
    items: [
      { to: "/model", icon: "🧠", label: "Model Performance" },
    ]
  },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside style={{
      width: "220px", height: "100vh",
      background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
      borderRight: "1px solid #1e293b",
      position: "fixed", top: 0, left: 0,
      display: "flex", flexDirection: "column",
      zIndex: 100, overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "#38bdf8", letterSpacing: "-0.5px" }}>✈️ AI Kavach</div>
        <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>Predictive Maintenance</div>
      </div>

      {/* Nav Groups */}
      <nav style={{ flex: 1, padding: "12px 12px 0" }}>
        {NAV_GROUPS.map(({ label, items }) => (
          <div key={label} style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "10px", color: "#334155", fontWeight: 600, letterSpacing: "1px", padding: "0 14px", marginBottom: "4px" }}>
              {label}
            </div>
            {items.map(({ to, icon, label: itemLabel }) => {
              const active = pathname === to;
              return (
                <Link key={to} to={to} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 14px", borderRadius: "10px",
                  textDecoration: "none", fontSize: "13px",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#38bdf8" : "#94a3b8",
                  background: active ? "rgba(56,189,248,0.1)" : "transparent",
                  borderLeft: active ? "3px solid #38bdf8" : "3px solid transparent",
                  transition: "all 0.18s ease", marginBottom: "2px",
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#e2e8f0"; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; } }}
                >
                  <span style={{ fontSize: "16px" }}>{icon}</span>
                  {itemLabel}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: "1px solid #1e293b", fontSize: "11px", color: "#334155", flexShrink: 0 }}>
        NASA CMAPSS Dataset
      </div>
    </aside>
  );
}
