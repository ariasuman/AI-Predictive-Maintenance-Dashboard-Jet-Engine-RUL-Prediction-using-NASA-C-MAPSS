import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import RULLineChart from "./charts/LineChart";
import FeatureBarChart from "./charts/BarChart";
import ActualVsPredicted from "./charts/ScatterChart";

const card = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  borderRadius: "14px", border: "1px solid #1e293b",
  padding: "20px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
};

const LAST_MAINTENANCE = "2024-11-15";

function HealthScore({ pct, status }) {
  const color = status === "Good" ? "#22c55e" : status === "Warning" ? "#facc15" : "#ef4444";
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 45 45)" style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <text x="45" y="49" textAnchor="middle" fill="#f1f5f9" fontSize="16" fontWeight="700">{pct}%</text>
      </svg>
      <div>
        <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Health Score</div>
        <div style={{ fontSize: "20px", fontWeight: 700, color }}>{status}</div>
        <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>Fleet overall</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [engine, setEngine] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/stats")
      .then(res => { setStats(res.data); setLoading(false); })
      .catch(() => { setError("Cannot reach backend. Start Flask first."); setLoading(false); });
  }, []);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#475569" }}>⏳ Loading real data from model...</div>;
  if (error)   return <div style={{ padding: "20px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", color: "#ef4444", fontSize: "13px" }}>⚠️ {error}</div>;

  const engines      = stats.engines || [];
  const total        = stats.total_engines || 0;
  const healthyCount = stats.healthy_count || 0;
  const healthPct    = total > 0 ? Math.round((healthyCount / total) * 100) : 0;
  const selectedEngine = engines.find(e => e.engine === engine) || null;
  const scatterData  = engines
    .filter(e => e.actual != null && e.predicted != null)
    .map(e => ({ actual: e.actual, predicted: e.predicted }));

  const kpiData = [
    { label: "Total Engines",   value: stats.total_engines ?? "—", icon: "🛩️", color: "#38bdf8", sub: "Fleet monitored" },
    { label: "Average RUL",     value: stats.avg_rul       ?? "—", icon: "⏱️", color: "#818cf8", sub: "Cycles remaining" },
    { label: "Critical Engines",value: stats.failure_count ?? "—", icon: "⚠️", color: "#ef4444", sub: "RUL ≤ 50 cycles" },
    { label: "Last Maintenance",value: LAST_MAINTENANCE,            icon: "🔧", color: "#34d399", sub: "Scheduled check" },
  ];

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9" }}>✈️ Predictive Maintenance Dashboard</h1>
          <p style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>NASA CMAPSS · {stats.total_engines ?? 0} engines · Live XGBoost predictions</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/alerts")} style={{ padding: "8px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", fontSize: "12px", cursor: "pointer" }}>
            🔔 {stats.failure_count ?? 0} Alerts
          </button>
          <button onClick={() => navigate("/maintenance")} style={{ padding: "8px 14px", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: "8px", color: "#38bdf8", fontSize: "12px", cursor: "pointer" }}>
            🔧 Schedule
          </button>
        </div>
      </div>

      {/* Health Score + KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "20px", alignItems: "stretch" }}>
        <div style={{ ...card, display: "flex", alignItems: "center" }}>
          <HealthScore pct={healthPct} status={stats.health_status} />
        </div>
        {kpiData.map(({ label, value, icon, color: c, sub }) => (
          <div key={label} style={{ ...card, borderTop: `3px solid ${c}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
                <p style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>{value}</p>
                <p style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>{sub}</p>
              </div>
              <span style={{ fontSize: "24px" }}>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Fleet status pills */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {[
          { label: "Healthy", count: stats.healthy_count ?? 0, color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
          { label: "Warning", count: stats.warning_count ?? 0, color: "#facc15", bg: "rgba(250,204,21,0.1)" },
          { label: "Critical",count: stats.failure_count ?? 0, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
        ].map(({ label, count, color: c, bg }) => (
          <div key={label} style={{ padding: "8px 20px", background: bg, border: `1px solid ${c}40`, borderRadius: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: c }} />
            <span style={{ fontSize: "13px", color: c, fontWeight: 600 }}>{count} {label}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: "12px", color: "#334155", alignSelf: "center" }}>
          Model: XGBoost · Dataset: NASA CMAPSS FD001
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div style={card}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "16px" }}>Engine #1 — RUL Trend (Last 30 Cycles)</p>
          <RULLineChart data={stats.rul_trend || []} />
        </div>

        {/* Engine Drill-down */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8" }}>Engine Detail</p>
            <select value={engine} onChange={e => setEngine(Number(e.target.value))}
              style={{ background: "#020617", border: "1px solid #334155", color: "#94a3b8", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>
              {engines.map(e => <option key={e.engine} value={e.engine}>Engine #{e.engine}</option>)}
            </select>
          </div>
          {selectedEngine && (
            <>
              <div style={{ padding: "14px", background: `rgba(${selectedEngine.status === "Healthy" ? "34,197,94" : selectedEngine.status === "Warning" ? "250,204,21" : "239,68,68"},0.08)`, borderRadius: "10px", border: `1px solid rgba(${selectedEngine.status === "Healthy" ? "34,197,94" : selectedEngine.status === "Warning" ? "250,204,21" : "239,68,68"},0.2)`, textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: selectedEngine.status === "Healthy" ? "#22c55e" : selectedEngine.status === "Warning" ? "#facc15" : "#ef4444" }}>{selectedEngine.predicted}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Predicted RUL (cycles)</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: selectedEngine.status === "Healthy" ? "#22c55e" : selectedEngine.status === "Warning" ? "#facc15" : "#ef4444", marginTop: "4px" }}>
                  {selectedEngine.status === "Healthy" ? "✔" : "⚠️"} {selectedEngine.status}
                </div>
              </div>
              {[
                { label: "Predicted RUL", val: Math.min(selectedEngine.predicted, 125), color: selectedEngine.status === "Healthy" ? "#22c55e" : selectedEngine.status === "Warning" ? "#facc15" : "#ef4444", display: `${selectedEngine.predicted} cycles` },
                { label: "Actual RUL",    val: Math.min(selectedEngine.actual, 125),    color: "#38bdf8", display: `${selectedEngine.actual} cycles` },
              ].map(({ label, val, color: c, display }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                    <span>{label}</span><span style={{ color: c }}>{display}</span>
                  </div>
                  <div style={{ background: "#1e293b", borderRadius: "4px", height: "5px" }}>
                    <div style={{ width: `${(val / 125) * 100}%`, background: c, height: "5px", borderRadius: "4px", transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ))}
              <button onClick={() => navigate("/sensors")} style={{ marginTop: "4px", padding: "8px", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "8px", color: "#38bdf8", fontSize: "12px", cursor: "pointer" }}>
                📡 View Sensor Data →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={card}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "16px" }}>Sensor Feature Importance</p>
          <FeatureBarChart />
        </div>
        <div style={card}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>Actual vs Predicted RUL</p>
          <p style={{ fontSize: "11px", color: "#334155", marginBottom: "12px" }}>All 100 engines · 🟢 Healthy · 🟡 Warning · 🔴 Critical</p>
          <ActualVsPredicted data={scatterData} />
        </div>
      </div>
    </div>
  );
}
