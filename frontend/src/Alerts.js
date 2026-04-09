import React, { useState, useEffect } from "react";
import axios from "axios";

const SEVERITY_STYLE = {
  Critical: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", icon: "🔴" },
  High:     { color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.25)", icon: "🟠" },
  Warning:  { color: "#facc15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.25)", icon: "🟡" },
};

const card = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  borderRadius: "14px", border: "1px solid #1e293b",
  padding: "20px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
};

export default function Alerts() {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("All");
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/alerts")
      .then(res => { setAlerts(res.data.alerts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = alerts.filter(a => {
    if (dismissed.has(a.id)) return false;
    if (filter === "All") return true;
    return a.severity === filter;
  });

  const counts = { Critical: 0, High: 0, Warning: 0 };
  alerts.forEach(a => { if (counts[a.severity] !== undefined) counts[a.severity]++; });

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9" }}>🔔 Alerts & Notifications</h1>
        <p style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>Real-time anomaly detection based on XGBoost RUL predictions</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Critical", count: counts.Critical, color: "#ef4444", sub: "RUL ≤ 20 cycles" },
          { label: "High",     count: counts.High,     color: "#fb923c", sub: "RUL ≤ 50 cycles" },
          { label: "Warning",  count: counts.Warning,  color: "#facc15", sub: "RUL ≤ 80 cycles" },
        ].map(({ label, count, color, sub }) => (
          <div key={label} style={{ ...card, borderTop: `3px solid ${color}`, cursor: "pointer" }} onClick={() => setFilter(filter === label ? "All" : label)}>
            <div style={{ fontSize: "28px", fontWeight: 700, color }}>{count}</div>
            <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "2px" }}>{label} Alerts</div>
            <div style={{ fontSize: "11px", color: "#475569" }}>{sub}</div>
            {filter === label && <div style={{ fontSize: "10px", color, marginTop: "4px" }}>● Filtered</div>}
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
        {["All", "Critical", "High", "Warning"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: "20px", fontSize: "12px", cursor: "pointer",
            background: filter === f ? "rgba(56,189,248,0.15)" : "transparent",
            border: filter === f ? "1px solid #38bdf8" : "1px solid #334155",
            color: filter === f ? "#38bdf8" : "#64748b",
          }}>{f}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "12px", color: "#475569" }}>{filtered.length} alerts shown</span>
      </div>

      {/* Alert list */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#475569", padding: "40px" }}>⏳ Loading alerts...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "40px", color: "#475569" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
          No alerts for this filter
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(alert => {
            const s = SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.Warning;
            return (
              <div key={alert.id} style={{
                background: s.bg, border: `1px solid ${s.border}`,
                borderRadius: "12px", padding: "16px 20px",
                display: "flex", alignItems: "center", gap: "16px",
              }}>
                <span style={{ fontSize: "20px", flexShrink: 0 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9" }}>{alert.engine}</span>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: `${s.color}20`, color: s.color, fontWeight: 600 }}>{alert.severity}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>{alert.message}</p>
                  <p style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>Actual RUL: {alert.actual} cycles · Predicted: {alert.rul} cycles</p>
                </div>
                <button onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
                  style={{ padding: "6px 12px", background: "transparent", border: "1px solid #334155", borderRadius: "6px", color: "#475569", fontSize: "11px", cursor: "pointer", flexShrink: 0 }}>
                  Dismiss
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
