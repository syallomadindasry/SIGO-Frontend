// src/components/Sidebar.jsx
import React from "react";
import "../styles/sidebar.css";
import logoSigo from "../assets/logosigo.png";

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

  const roleText = user?.role === "dinkes" ? "Dinas Kesehatan" : gudangName || "-";
  const roleIcon = user?.role === "dinkes" ? "🏥" : "🏨";

  const initials = (user?.nama || "A")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const [logoOk, setLogoOk] = React.useState(true);

  return (
    <aside className="sidebar">
      {/* TOP SECTION: logo + admin card (gabung) */}
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
              {initials}
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
          ➜🚪 Logout
        </button>
      </div>
    </aside>
  );
}