import React, { useState, useEffect } from "react";
import axios from "axios";

const card = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  borderRadius: "14px",
  border: "1px solid #1e293b",
  padding: "20px 24px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
};

function suggestDate(rul) {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(1, Math.floor(rul * 0.7)));
  return d.toISOString().split("T")[0];
}

export default function Maintenance() {
  const [engines, setEngines] = useState([]);
  const [scheduled, setScheduled] = useState({});
  const [notes, setNotes] = useState({});
  const [saved, setSaved] = useState({});
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/stats")
      .then(res => {
        const allEngines = res.data.engines || [];
        setEngines(allEngines);

        const dates = {};
        allEngines.forEach(e => {
          dates[e.engine] = suggestDate(e.predicted);
        });
        setScheduled(dates);

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = (id) => {
    setSaved(prev => ({ ...prev, [id]: true }));
  };

  const filtered = engines.filter(e => {
    if (filter === "Critical") return e.status === "Critical";
    if (filter === "Warning") return e.status === "Warning";
    if (filter === "Healthy") return e.status === "Healthy";
    return true;
  });

  return (
    <div style={{ maxWidth: "1000px" }}>
      <h1 style={{ color: "white", marginBottom: "20px" }}>
        🔧 Maintenance Scheduling
      </h1>

      {/* FILTER */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {["All", "Critical", "Warning", "Healthy"].map(f => (
          <button key={f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "gray" }}>Loading...</p>
      ) : (
        filtered.map(e => {
          const color =
            e.status === "Critical"
              ? "#ef4444"
              : e.status === "Warning"
              ? "#facc15"
              : "#22c55e";

          return (
            <div key={e.engine} style={{
              ...card,
              marginBottom: "10px",
              borderLeft: `5px solid ${color}`
            }}>
              <h3 style={{ color: "white" }}>
                Engine #{e.engine} — {e.status}
              </h3>

              <p style={{ color: color }}>
                RUL: {e.predicted} cycles
              </p>

              <p style={{ color: "#38bdf8" }}>
                Suggested: {suggestDate(e.predicted)}
              </p>

              <input
                placeholder="Notes"
                value={notes[e.engine] || ""}
                onChange={ev =>
                  setNotes(prev => ({
                    ...prev,
                    [e.engine]: ev.target.value
                  }))
                }
              />

              <input
                type="date"
                value={scheduled[e.engine] || ""}
                onChange={ev =>
                  setScheduled(prev => ({
                    ...prev,
                    [e.engine]: ev.target.value
                  }))
                }
              />

              <button onClick={() => handleSave(e.engine)}>
                {saved[e.engine] ? "Saved ✅" : "Save"}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}