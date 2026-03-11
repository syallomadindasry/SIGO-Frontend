// File: frontend/src/components/Topbar.jsx
import React from "react";

export default function Topbar({ title }) {
  return (
    <div className="topbar">
      <h1>📋 {title}</h1>
      <div className="topbar-right">
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          📅{" "}
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}