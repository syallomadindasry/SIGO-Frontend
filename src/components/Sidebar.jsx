// src/components/Sidebar.jsx
import React from "react";
import "../styles/sidebar.css";
import logoSigo from "../assets/logosigo.png";

function getApLabelFromGudangName(gudangName) {
  const name = String(gudangName || "");
  const m = name.match(/puskesmas\s*(\d+)/i);
  if (!m) return null;

  const n = Number.parseInt(m[1], 10);
  if (!Number.isFinite(n)) return null;

  return `AP${n}`; // AP1, AP2, AP3, dst
}

export default function Sidebar({
  user,
  gudangList,
  nav,
  activePage,
  setActivePage,
  onLogout,
}) {
  const gudangName =
    gudangList?.find((g) => String(g.id_gudang) === String(user?.id_gudang))
      ?.nama_gudang || "";

  const isDinkes = user?.role === "dinkes";

  const roleText = isDinkes ? "Dinas Kesehatan" : gudangName || "-";
  const roleIcon = isDinkes ? "🏥" : "🏨";

  const initials = (user?.nama || "A")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const apLabel = !isDinkes ? getApLabelFromGudangName(gudangName) : null;
  const avatarText = apLabel || initials;

  const [logoOk, setLogoOk] = React.useState(true);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-header sidebar-header--logoOnly">
          <div className="sidebar-logoWrapRect" title="SIGO">
            {logoOk ? (
              <img
                className="sidebar-brand-logo sidebar-brand-logo--big"
                src={logoSigo}
                alt="SIGO"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <div className="sidebar-logoFallback">SIGO</div>
            )}
          </div>
        </div>

        <div className="sidebar-user sidebar-user--nice">
          <div className="sidebar-user__row">
            <div className="sidebar-user__avatar" aria-hidden="true">
              {avatarText}
            </div>

            <div className="sidebar-user__meta">
              <div className="user-name sidebar-user__name">
                {user?.nama || "-"}
              </div>

              <div className="user-role sidebar-user__role">
                <span className="sidebar-user__badge">
                  <span className="sidebar-user__badgeIcon" aria-hidden="true">
                    {roleIcon}
                  </span>
                  <span className="sidebar-user__badgeText">{roleText}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {nav?.map((section) => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <div
                key={item.id}
                className={`nav-item ${activePage === item.id ? "active" : ""}`}
                onClick={() => setActivePage(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" || e.key === " "
                    ? setActivePage(item.id)
                    : null
                }
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="btn btn-secondary btn-full btn-sm"
          onClick={onLogout}
          style={{ background: "rgba(255,255,255,.14)", color: "#fff" }}
        >
          ↩🚪 Logout
        </button>
      </div>
    </aside>
  );
}