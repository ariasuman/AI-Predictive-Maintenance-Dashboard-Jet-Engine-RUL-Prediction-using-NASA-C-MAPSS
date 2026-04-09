import React, { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const card = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  borderRadius: "14px", border: "1px solid #1e293b",
  padding: "20px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
};

const SENSORS = [
  { key: "temperature", label: "Temperature (HPC Outlet)", color: "#f87171", unit: "°F" },
  { key: "pressure",    label: "Pressure (Bypass Ratio)",  color: "#38bdf8", unit: "" },
  { key: "speed",       label: "Fan Speed (Required)",     color: "#818cf8", unit: "rpm" },
  { key: "vibration",   label: "Bleed Enthalpy",           color: "#fb923c", unit: "" },
];

function SensorChart({ data, sensor }) {
  const latest = data.length ? data[data.length - 1][sensor.key] : null;
  const first  = data.length ? data[0][sensor.key] : null;
  const trend  = latest && first ? (latest > first ? "↑" : "↓") : "";
  const trendColor = sensor.key === "temperature" || sensor.key === "vibration"
    ? (trend === "↑" ? "#ef4444" : "#22c55e")
    : (trend === "↑" ? "#22c55e" : "#ef4444");

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8" }}>{sensor.label}</p>
          <p style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>Last 40 cycles</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "22px", fontWeight: 700, color: sensor.color }}>{latest?.toFixed(1)} <span style={{ fontSize: "11px" }}>{sensor.unit}</span></div>
          <div style={{ fontSize: "13px", color: trendColor }}>{trend} Trend</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="cycle" stroke="#475569" tick={{ fontSize: 10 }} />
          <YAxis stroke="#475569" tick={{ fontSize: 10 }} width={50} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} />
          <Line type="monotone" dataKey={sensor.key} stroke={sensor.color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Sensors() {
  const [engine, setEngine]   = useState(1);
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`http://127.0.0.1:5000/sensor-data/${engine}`)
      .then(res => { setData(res.data.data || []); setLoading(false); })
      .catch(() => { setError("Cannot reach backend."); setLoading(false); });
  }, [engine]);

  return (
    <div style={{ maxWidth: "1200px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9" }}>📡 Sensor Data Visualization</h1>
          <p style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>Real-time sensor readings from NASA CMAPSS test data</p>
        </div>
        <select value={engine} onChange={e => setEngine(Number(e.target.value))}
          style={{ background: "#0f172a", border: "1px solid #334155", color: "#94a3b8", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>
          {Array.from({ length: 100 }, (_, i) => i + 1).map(id => (
            <option key={id} value={id}>Engine #{id}</option>
          ))}
        </select>
      </div>

      {error && <div style={{ padding: "16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", color: "#ef4444", marginBottom: "20px" }}>⚠️ {error}</div>}

      {/* Multi-sensor comparison */}
      <div style={{ ...card, marginBottom: "20px" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "16px" }}>Engine #{engine} — All Sensors Comparison</p>
        {loading ? <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>Loading...</div> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="cycle" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {SENSORS.map(s => <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={1.5} dot={false} name={s.label} />)}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Individual sensor cards */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#475569", padding: "40px" }}>⏳ Loading sensor data...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {SENSORS.map(s => <SensorChart key={s.key} data={data} sensor={s} />)}
        </div>
      )}
    </div>
  );
}
