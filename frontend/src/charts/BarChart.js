import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const data = [
  { sensor: "s11", importance: 0.18 },
  { sensor: "s12", importance: 0.15 },
  { sensor: "s4",  importance: 0.13 },
  { sensor: "s7",  importance: 0.12 },
  { sensor: "s15", importance: 0.10 },
  { sensor: "s20", importance: 0.09 },
  { sensor: "s2",  importance: 0.08 },
  { sensor: "s3",  importance: 0.07 },
];

const COLORS = ["#38bdf8","#818cf8","#fb923c","#34d399","#f472b6","#facc15","#60a5fa","#a78bfa"];

export default function FeatureBarChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="sensor" stroke="#475569" tick={{ fontSize: 11 }} />
        <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v) => [(v * 100).toFixed(1) + "%", "Importance"]}
          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px" }}
        />
        <Bar dataKey="importance" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
