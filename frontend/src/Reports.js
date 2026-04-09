import React, { useState, useEffect } from "react";
import axios from "axios";

const card = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  borderRadius: "14px", border: "1px solid #1e293b",
  padding: "20px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
};

const MAINTENANCE_HISTORY = [
  { date: "2024-11-15", engine: "Engine #3",  type: "Scheduled",  action: "Full inspection", technician: "Team A", status: "Completed" },
  { date: "2024-10-28", engine: "Engine #20", type: "Emergency",  action: "Bearing replacement", technician: "Team B", status: "Completed" },
  { date: "2024-10-10", engine: "Engine #34", type: "Scheduled",  action: "Sensor calibration", technician: "Team A", status: "Completed" },
  { date: "2024-09-22", engine: "Engine #31", type: "Emergency",  action: "Fan blade repair", technician: "Team C", status: "Completed" },
  { date: "2024-09-05", engine: "Engine #35", type: "Preventive", action: "Oil change + filter", technician: "Team B", status: "Completed" },
];

export default function Reports() {
  const [engines, setEngines]   = useState([]);
  const [alerts, setAlerts]     = useState([]);
  const [tab, setTab]           = useState("maintenance");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get("http://127.0.0.1:5000/stats"),
      axios.get("http://127.0.0.1:5000/alerts"),
    ]).then(([statsRes, alertsRes]) => {
      setEngines(statsRes.data.engines || []);
      setAlerts(alertsRes.data.alerts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const exportEngineReport = () => {
    const rows = [["Engine", "Predicted RUL", "Actual RUL", "Status"]];
    engines.forEach(e => rows.push([`Engine #${e.engine}`, e.predicted, e.actual, e.status]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "engine_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportAlertReport = () => {
    const rows = [["Engine", "Severity", "RUL", "Actual RUL", "Message"]];
    alerts.forEach(a => rows.push([a.engine, a.severity, a.rul, a.actual, `"${a.message}"`]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "alerts_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = [
    { id: "maintenance", label: "🔧 Maintenance History" },
    { id: "engines",     label: "🛩️ Engine Report" },
    { id: "alerts",      label: "🔔 Alert History" },
  ];

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9" }}>📋 Reports & Logs</h1>
          <p style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>Maintenance history, engine reports, and alert logs</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={exportEngineReport} style={{ padding: "8px 14px", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: "8px", color: "#38bdf8", fontSize: "12px", cursor: "pointer" }}>⬇ Engine CSV</button>
          <button onClick={exportAlertReport}  style={{ padding: "8px 14px", background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.3)", borderRadius: "8px", color: "#fb923c", fontSize: "12px", cursor: "pointer" }}>⬇ Alerts CSV</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Engines",    value: engines.length,                                    color: "#38bdf8" },
          { label: "Total Alerts",     value: alerts.length,                                     color: "#fb923c" },
          { label: "Maintenance Logs", value: MAINTENANCE_HISTORY.length,                        color: "#818cf8" },
          { label: "Critical Engines", value: engines.filter(e => e.status === "Critical").length, color: "#ef4444" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...card, borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "#0f172a", padding: "4px", borderRadius: "10px", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 16px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", border: "none",
            background: tab === t.id ? "#1e293b" : "transparent",
            color: tab === t.id ? "#f1f5f9" : "#64748b",
            fontWeight: tab === t.id ? 600 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: "center", color: "#475569", padding: "40px" }}>⏳ Loading...</div> : (
        <div style={card}>
          {tab === "maintenance" && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b" }}>
                  {["Date", "Engine", "Type", "Action", "Technician", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MAINTENANCE_HISTORY.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #0f172a" }}>
                    <td style={{ padding: "12px", color: "#94a3b8" }}>{row.date}</td>
                    <td style={{ padding: "12px", color: "#f1f5f9", fontWeight: 600 }}>{row.engine}</td>
                    <td style={{ padding: "12px" }}><span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "11px", background: row.type === "Emergency" ? "rgba(239,68,68,0.15)" : "rgba(56,189,248,0.1)", color: row.type === "Emergency" ? "#ef4444" : "#38bdf8" }}>{row.type}</span></td>
                    <td style={{ padding: "12px", color: "#94a3b8" }}>{row.action}</td>
                    <td style={{ padding: "12px", color: "#64748b" }}>{row.technician}</td>
                    <td style={{ padding: "12px" }}><span style={{ color: "#22c55e", fontSize: "12px" }}>✔ {row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "engines" && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b" }}>
                  {["Engine", "Predicted RUL", "Actual RUL", "Error", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {engines.map(e => {
                  const color = e.status === "Healthy" ? "#22c55e" : e.status === "Warning" ? "#facc15" : "#ef4444";
                  return (
                    <tr key={e.engine} style={{ borderBottom: "1px solid #0f172a" }}>
                      <td style={{ padding: "10px 12px", color: "#f1f5f9", fontWeight: 600 }}>Engine #{e.engine}</td>
                      <td style={{ padding: "10px 12px", color }}>{e.predicted}</td>
                      <td style={{ padding: "10px 12px", color: "#38bdf8" }}>{e.actual}</td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>{Math.abs(e.predicted - e.actual).toFixed(1)}</td>
                      <td style={{ padding: "10px 12px" }}><span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "11px", background: `${color}20`, color }}>{e.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {tab === "alerts" && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b" }}>
                  {["Engine", "Severity", "Predicted RUL", "Actual RUL", "Message"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => {
                  const color = a.severity === "Critical" ? "#ef4444" : a.severity === "High" ? "#fb923c" : "#facc15";
                  return (
                    <tr key={a.id} style={{ borderBottom: "1px solid #0f172a" }}>
                      <td style={{ padding: "10px 12px", color: "#f1f5f9", fontWeight: 600 }}>{a.engine}</td>
                      <td style={{ padding: "10px 12px" }}><span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "11px", background: `${color}20`, color }}>{a.severity}</span></td>
                      <td style={{ padding: "10px 12px", color }}>{a.rul}</td>
                      <td style={{ padding: "10px 12px", color: "#38bdf8" }}>{a.actual}</td>
                      <td style={{ padding: "10px 12px", color: "#64748b", fontSize: "12px" }}>{a.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
