import React from "react";
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

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img className="sidebar-brand-logo" src={logoSigo} alt="SIGO" />
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">SIGO</div>
            <div className="sidebar-brand-sub">Sistem Gudang Obat</div>
          </div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-name">👤 {user?.nama || "-"}</div>
        <div className="user-role">
          {user?.role === "dinkes" ? "🏥 Dinkes" : `🏨 ${gudangName}`}
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