import React from "react";

export default function GaugeChart({ value, max = 200 }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const angle = -135 + pct * 270;
  const color = value > 100 ? "#22c55e" : value > 50 ? "#facc15" : "#ef4444";
  const label = value > 100 ? "Healthy" : value > 50 ? "Warning" : "Critical";

  const arcPath = (startDeg, endDeg, r, cx, cy) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const cx = 100, cy = 100, r = 70;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="200" height="140" viewBox="0 0 200 140">
        {/* Background arc */}
        <path d={arcPath(-135, 135, r, cx, cy)} fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
        {/* Value arc */}
        <path d={arcPath(-135, -135 + pct * 270, r, cx, cy)} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={cx + 55 * Math.cos((angle * Math.PI) / 180)}
          y2={cy + 55 * Math.sin((angle * Math.PI) / 180)}
          stroke={color} strokeWidth="2.5" strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill={color} />
        {/* Value text */}
        <text x={cx} y={cy + 28} textAnchor="middle" fill="#e2e8f0" fontSize="22" fontWeight="700">{Math.round(value)}</text>
        <text x={cx} y={cy + 44} textAnchor="middle" fill="#64748b" fontSize="11">cycles remaining</text>
      </svg>
      <span style={{
        marginTop: "4px",
        padding: "4px 16px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: 600,
        background: value > 100 ? "rgba(34,197,94,0.15)" : value > 50 ? "rgba(250,204,21,0.15)" : "rgba(239,68,68,0.15)",
        color,
      }}>{label}</span>
    </div>
  );
}
