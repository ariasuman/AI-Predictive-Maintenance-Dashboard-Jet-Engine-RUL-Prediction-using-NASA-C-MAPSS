import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

export default function RULLineChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="cycle" stroke="#475569" tick={{ fontSize: 11 }}
          label={{ value: "Cycle", position: "insideBottom", offset: -2, fill: "#475569", fontSize: 11 }} />
        <YAxis stroke="#475569" tick={{ fontSize: 11 }} domain={[0, 130]} />
        <Tooltip
          formatter={(v) => [v.toFixed(1), "Predicted RUL"]}
          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px" }}
        />
        <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Healthy", fill: "#22c55e", fontSize: 10, position: "right" }} />
        <ReferenceLine y={50}  stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Critical", fill: "#ef4444", fontSize: 10, position: "right" }} />
        <Line type="monotone" dataKey="rul" stroke="#38bdf8" strokeWidth={2} dot={false} name="RUL" />
      </LineChart>
    </ResponsiveContainer>
  );
}
