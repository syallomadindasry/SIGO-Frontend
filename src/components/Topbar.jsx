// File: frontend/src/components/Topbar.jsx
import React from "react";

function useIsMobile(breakpointPx = 640) {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${breakpointPx}px)`).matches;
  });

  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const onChange = (e) => setIsMobile(e.matches);

    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    setIsMobile(mq.matches);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [breakpointPx]);

  return isMobile;
}

export default function Topbar({ title }) {
  const isMobile = useIsMobile(640);
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tanggal = React.useMemo(() => {
    if (isMobile) {
      // Ringkas: 12/03
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
      }).format(now);
    }

    // Lengkap: Senin, 12 Maret 2026
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(now);
  }, [now, isMobile]);

  const jam = React.useMemo(() => {
    if (isMobile) {
      // Ringkas: 09:11
      return new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);
    }

    // Lengkap: 09:11:23
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
  }, [now, isMobile]);

  return (
    <div className="topbar">
      <h1>📋 {title}</h1>
      <div className="topbar-right">
        <span
          className="topbar-datetime"
          title={`${tanggal} • ${jam}`}
          style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}
        >
          📅 {tanggal} <span style={{ opacity: 0.7 }}>•</span> ⏰ {jam}
        </span>
      </div>
    </div>
  );
}