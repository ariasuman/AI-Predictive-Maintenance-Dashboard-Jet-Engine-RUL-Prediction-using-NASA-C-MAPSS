import React from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

export default function ActualVsPredicted({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="actual" name="Actual RUL" stroke="#475569" tick={{ fontSize: 11 }}
          label={{ value: "Actual", position: "insideBottom", offset: -2, fill: "#475569", fontSize: 11 }} />
        <YAxis dataKey="predicted" name="Predicted RUL" stroke="#475569" tick={{ fontSize: 11 }} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(v, name) => [v.toFixed(1), name === "actual" ? "Actual RUL" : "Predicted RUL"]}
          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px" }}
        />
        <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 130, y: 130 }]} stroke="#334155" strokeDasharray="4 4" />
        <Scatter data={data} name="Engines">
          {data.map((d, i) => (
            <Cell key={i} fill={d.predicted <= 50 ? "#ef4444" : d.predicted <= 100 ? "#facc15" : "#22c55e"} opacity={0.8} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
