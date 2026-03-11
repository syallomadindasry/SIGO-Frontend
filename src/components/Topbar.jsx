// File: frontend/src/components/Topbar.jsx
import React from "react";

export default function Topbar({ title }) {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tanggal = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  const jam = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  return (
    <div className="topbar">
      <h1>📋 {title}</h1>
      <div className="topbar-right">
        <span style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          📅 {tanggal} <span style={{ opacity: 0.7 }}>•</span> ⏰ {jam}
        </span>
      </div>
    </div>
  );
}