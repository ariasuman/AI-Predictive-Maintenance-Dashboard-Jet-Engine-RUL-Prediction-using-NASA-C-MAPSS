import React, { useState } from "react";
import axios from "axios";
import GaugeChart from "./charts/GaugeChart";

const SENSOR_LABELS = [
  "s2 (Fan inlet temp)", "s3 (LPC outlet temp)", "s4 (HPC outlet temp)",
  "s7 (LPT outlet temp)", "s8 (Fan inlet Ps30)", "s9 (Bypass ratio)",
  "s11 (Bleed enthalpy)", "s12 (Required fan speed)", "s13 (Corrected fan speed)",
  "s14 (HPT coolant bleed)", "s15 (LPT coolant bleed)", "s17 (Bypass ratio)",
  "s20 (Burner fuel-air ratio)", "s21 (Demanded fan speed)",
];

const DEFAULT_VALUES = [642.0, 1590.0, 1400.0, 554.0, 9.22, 14.62, 47.47, 521.66, 2388.02, 8138.62, 8.4195, 0.03, 392.0, 2388.0];

const card = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  borderRadius: "14px",
  border: "1px solid #1e293b",
  padding: "24px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
};

const inputStyle = {
  width: "100%",
  background: "#020617",
  border: "1px solid #334155",
  borderRadius: "8px",
  padding: "8px 12px",
  color: "#e2e8f0",
  fontSize: "13px",
  outline: "none",
};

export default function Predict() {
  const [values, setValues] = useState([...DEFAULT_VALUES]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (i, v) => {
    const next = [...values];
    next[i] = Number(v);
    setValues(next);
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post("http://127.0.0.1:5000/predict", { data: values });
      setResult(res.data.rul);
    } catch {
      setError("Failed to connect to backend. Ensure Flask is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (result === null) return;
    const health = result > 100 ? "Healthy" : result > 50 ? "Warning" : "Critical";
    const rows = [
      ["Sensor", "Value"],
      ...SENSOR_LABELS.map((l, i) => [l, values[i]]),
      [],
      ["Predicted RUL", result],
      ["Health Status", health],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "rul_prediction.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const health = result !== null ? (result > 100 ? "Healthy" : result > 50 ? "Warning" : "Critical") : null;
  const healthColor = { Healthy: "#22c55e", Warning: "#facc15", Critical: "#ef4444" };

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9" }}>🤖 RUL Prediction</h1>
        <p style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>Enter sensor readings to predict Remaining Useful Life</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>
        {/* Input Form */}
        <div style={card}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "18px" }}>Sensor Input Values</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {SENSOR_LABELS.map((label, i) => (
              <div key={i}>
                <label style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "4px" }}>{label}</label>
                <input
                  type="number"
                  value={values[i]}
                  onChange={e => handleChange(i, e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#38bdf8"}
                  onBlur={e => e.target.style.borderColor = "#334155"}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button
              onClick={handlePredict}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px",
                background: loading ? "#1e293b" : "linear-gradient(135deg, #0ea5e9, #6366f1)",
                border: "none",
                borderRadius: "10px",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "⏳ Predicting..." : "🚀 Predict RUL"}
            </button>
            {result !== null && (
              <button
                onClick={downloadCSV}
                style={{
                  padding: "12px 18px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  color: "#94a3b8",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                ⬇ CSV
              </button>
            )}
          </div>

          {error && (
            <div style={{ marginTop: "14px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", fontSize: "12px" }}>
              {error}
            </div>
          )}
        </div>

        {/* Result Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ ...card, textAlign: "center" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "16px" }}>Health Gauge</p>
            {result !== null ? (
              <>
                <GaugeChart value={result} />
                <div style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: `rgba(${health === "Healthy" ? "34,197,94" : health === "Warning" ? "250,204,21" : "239,68,68"},0.1)`,
                  border: `1px solid rgba(${health === "Healthy" ? "34,197,94" : health === "Warning" ? "250,204,21" : "239,68,68"},0.3)`,
                  borderRadius: "10px",
                }}>
                  <p style={{ fontSize: "12px", color: "#64748b" }}>Predicted RUL</p>
                  <p style={{ fontSize: "32px", fontWeight: 700, color: healthColor[health] }}>{Math.round(result)}</p>
                  <p style={{ fontSize: "11px", color: "#475569" }}>cycles remaining</p>
                </div>
              </>
            ) : (
              <div style={{ padding: "40px 0", color: "#334155", fontSize: "13px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎯</div>
                Enter sensor values and click Predict
              </div>
            )}
          </div>

          {/* Health Legend */}
          <div style={card}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "12px" }}>Health Thresholds</p>
            {[
              { label: "Healthy", range: "RUL > 100", color: "#22c55e" },
              { label: "Warning", range: "50 < RUL ≤ 100", color: "#facc15" },
              { label: "Critical", range: "RUL ≤ 50", color: "#ef4444" },
            ].map(({ label, range, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "#94a3b8", flex: 1 }}>{label}</span>
                <span style={{ fontSize: "11px", color: "#475569" }}>{range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
