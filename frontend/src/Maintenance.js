import React, { useState, useEffect } from "react";
import axios from "axios";

const card = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  borderRadius: "14px", border: "1px solid #1e293b",
  padding: "20px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
};

// Suggest maintenance date: assume 1 cycle = 1 day from today
function suggestDate(rul) {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(1, Math.floor(rul * 0.7)));
  return d.toISOString().split("T")[0];
}

export default function Maintenance() {
  const [engines, setEngines]     = useState([]);
  const [scheduled, setScheduled] = useState({});
  const [notes, setNotes]         = useState({});
  const [saved, setSaved]         = useState({});
  const [filter, setFilter]       = useState("All");
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/stats")
      .then(res => {
        const critical = (res.data.engines || []).filter(e => e.predicted <= 100);
        setEngines(critical);
        // Pre-fill suggested dates
        const dates = {};
        critical.forEach(e => { dates[e.engine] = suggestDate(e.predicted); });
        setScheduled(dates);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = (id) => setSaved(prev => ({ ...prev, [id]: true }));

  const filtered = engines.filter(e => {
    if (filter === "Critical") return e.predicted <= 50;
    if (filter === "Warning")  return e.predicted > 50 && e.predicted <= 100;
    return true;
  });

  const exportCSV = () => {
    const rows = [["Engine", "Status", "Predicted RUL", "Suggested Date", "Scheduled Date", "Notes"]];
    engines.forEach(e => {
      rows.push([`Engine #${e.engine}`, e.status, e.predicted, suggestDate(e.predicted), scheduled[e.engine] || "", notes[e.engine] || ""]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "maintenance_schedule.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9" }}>🔧 Maintenance Scheduling</h1>
          <p style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>Suggested maintenance dates based on predicted RUL · {engines.length} engines need attention</p>
        </div>
        <button onClick={exportCSV} style={{ padding: "8px 16px", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: "8px", color: "#38bdf8", fontSize: "13px", cursor: "pointer" }}>
          ⬇ Export Schedule
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Immediate (≤50 cycles)",  count: engines.filter(e => e.predicted <= 50).length,  color: "#ef4444" },
          { label: "Soon (51–100 cycles)",     count: engines.filter(e => e.predicted > 50 && e.predicted <= 100).length, color: "#facc15" },
          { label: "Scheduled",                count: Object.keys(saved).length,                      color: "#22c55e" },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ ...card, borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color }}>{count}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["All", "Critical", "Warning"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: "20px", fontSize: "12px", cursor: "pointer",
            background: filter === f ? "rgba(56,189,248,0.15)" : "transparent",
            border: filter === f ? "1px solid #38bdf8" : "1px solid #334155",
            color: filter === f ? "#38bdf8" : "#64748b",
          }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#475569", padding: "40px" }}>⏳ Loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(e => {
            const isCritical = e.predicted <= 50;
            const color = isCritical ? "#ef4444" : "#facc15";
            const isSaved = saved[e.engine];
            return (
              <div key={e.engine} style={{
                ...card, padding: "16px 20px",
                borderLeft: `4px solid ${isSaved ? "#22c55e" : color}`,
                display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "16px", alignItems: "center",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9" }}>Engine #{e.engine}</span>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: `${color}20`, color, fontWeight: 600 }}>{e.status}</span>
                    {isSaved && <span style={{ fontSize: "11px", color: "#22c55e" }}>✔ Scheduled</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Predicted RUL: <span style={{ color }}>{e.predicted} cycles</span> · Suggested: <span style={{ color: "#38bdf8" }}>{suggestDate(e.predicted)}</span>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={notes[e.engine] || ""}
                  onChange={ev => setNotes(prev => ({ ...prev, [e.engine]: ev.target.value }))}
                  style={{ background: "#020617", border: "1px solid #334155", borderRadius: "6px", padding: "6px 10px", color: "#e2e8f0", fontSize: "12px", width: "160px", outline: "none" }}
                />
                <input
                  type="date"
                  value={scheduled[e.engine] || ""}
                  onChange={ev => setScheduled(prev => ({ ...prev, [e.engine]: ev.target.value }))}
                  style={{ background: "#020617", border: "1px solid #334155", borderRadius: "6px", padding: "6px 10px", color: "#e2e8f0", fontSize: "12px", outline: "none" }}
                />
                <button onClick={() => handleSave(e.engine)} style={{
                  padding: "7px 14px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: 600,
                  background: isSaved ? "rgba(34,197,94,0.15)" : "rgba(56,189,248,0.15)",
                  border: isSaved ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(56,189,248,0.4)",
                  color: isSaved ? "#22c55e" : "#38bdf8",
                }}>
                  {isSaved ? "✔ Saved" : "Save"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
