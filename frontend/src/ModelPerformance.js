import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

const card = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  borderRadius: "14px", border: "1px solid #1e293b",
  padding: "20px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
};

function MetricCard({ label, value, unit, sub, color, icon }) {
  return (
    <div style={{ ...card, borderTop: `3px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{label}</p>
          <p style={{ fontSize: "28px", fontWeight: 700, color }}>{value}<span style={{ fontSize: "14px", color: "#64748b", marginLeft: "4px" }}>{unit}</span></p>
          <p style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>{sub}</p>
        </div>
        <span style={{ fontSize: "28px" }}>{icon}</span>
      </div>
    </div>
  );
}

export default function ModelPerformance() {
  const [perf, setPerf]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/model-performance")
      .then(res => { setPerf(res.data); setLoading(false); })
      .catch(() => { setError("Cannot reach backend."); setLoading(false); });
  }, []);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#475569" }}>⏳ Loading model metrics...</div>;
  if (error)   return <div style={{ padding: "20px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", color: "#ef4444" }}>⚠️ {error}</div>;

  const accuracy10 = ((perf.within_10 / perf.total) * 100).toFixed(1);
  const accuracy20 = ((perf.within_20 / perf.total) * 100).toFixed(1);

  // Top 30 engines by error for chart
  const chartData = [...perf.errors].sort((a, b) => b.error - a.error).slice(0, 30);

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9" }}>🧠 Model Performance</h1>
        <p style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>XGBoost regression metrics on NASA CMAPSS FD001 test set · {perf.total} engines</p>
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <MetricCard label="RMSE"          value={perf.rmse}      unit="cycles" sub="Root Mean Squared Error"    color="#ef4444" icon="📉" />
        <MetricCard label="MAE"           value={perf.mae}       unit="cycles" sub="Mean Absolute Error"        color="#fb923c" icon="📊" />
        <MetricCard label="R² Score"      value={perf.r2}        unit=""       sub="Coefficient of determination" color="#22c55e" icon="🎯" />
        <MetricCard label="Within ±10"    value={`${accuracy10}%`} unit=""    sub={`${perf.within_10}/${perf.total} engines`} color="#38bdf8" icon="✅" />
      </div>

      {/* Accuracy breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div style={card}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "16px" }}>Prediction Accuracy Breakdown</p>
          {[
            { label: "Within ±10 cycles",  pct: accuracy10, color: "#22c55e", count: perf.within_10 },
            { label: "Within ±20 cycles",  pct: accuracy20, color: "#38bdf8", count: perf.within_20 },
            { label: "Outside ±20 cycles", pct: (100 - accuracy20).toFixed(1), color: "#ef4444", count: perf.total - perf.within_20 },
          ].map(({ label, pct, color, count }) => (
            <div key={label} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "5px" }}>
                <span>{label}</span>
                <span style={{ color }}>{pct}% ({count} engines)</span>
              </div>
              <div style={{ background: "#1e293b", borderRadius: "4px", height: "8px" }}>
                <div style={{ width: `${pct}%`, background: color, height: "8px", borderRadius: "4px", transition: "width 0.8s ease" }} />
              </div>
            </div>
          ))}
        </div>

        <div style={card}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "16px" }}>Model Info</p>
          {[
            { label: "Algorithm",       value: "XGBoost Regressor" },
            { label: "Dataset",         value: "NASA CMAPSS FD001" },
            { label: "Training Engines",value: "80 engines" },
            { label: "Test Engines",    value: `${perf.total} engines` },
            { label: "Features",        value: "59 (14 sensors + rolling stats)" },
            { label: "RUL Clipping",    value: "125 cycles max" },
            { label: "n_estimators",    value: "300" },
            { label: "Learning Rate",   value: "0.05" },
            { label: "Max Depth",       value: "6" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #0f172a", fontSize: "12px" }}>
              <span style={{ color: "#64748b" }}>{label}</span>
              <span style={{ color: "#94a3b8", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-engine error chart */}
      <div style={card}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>Per-Engine Prediction Error (Top 30 by Error)</p>
        <p style={{ fontSize: "11px", color: "#334155", marginBottom: "16px" }}>|Actual RUL − Predicted RUL| · lower is better</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="engine" stroke="#475569" tick={{ fontSize: 10 }} tickFormatter={v => `#${v}`} />
            <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v, n, p) => [`${v} cycles`, "Error"]}
              labelFormatter={l => `Engine #${l}`}
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px" }}
            />
            <ReferenceLine y={10} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "±10", fill: "#22c55e", fontSize: 10 }} />
            <ReferenceLine y={20} stroke="#facc15" strokeDasharray="4 4" label={{ value: "±20", fill: "#facc15", fontSize: 10 }} />
            <Bar dataKey="error" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.error <= 10 ? "#22c55e" : d.error <= 20 ? "#facc15" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
