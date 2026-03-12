import React, { useMemo, useState } from "react";

function getStatus(stok) {
  const n = Number(stok || 0);
  if (n < 100) return { label: "Kritis", color: "#ef4444", bg: "#fde7ea" };
  if (n < 200) return { label: "Hampir habis", color: "#eab308", bg: "#fef3c7" };
  return { label: "Aman", color: "#15803d", bg: "#e7f3ea" };
}

function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("id-ID");
}

export default function StokMonitor({ user, stokData = [] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  const myStok = useMemo(() => {
    if (!user) return [];

    const isDinkes =
      user.role === "dinkes" ||
      user?.warehouse?.type === "DINKES";

    if (isDinkes) {
      return stokData;
    }

    return stokData.filter(
      (s) => String(s.id_gudang) === String(user.id_gudang)
    );
  }, [stokData, user]);

  const grouped = useMemo(() => {
    const map = new Map();

    myStok.forEach((item) => {
      const key = item.id_obat || item.nama_obat;
      if (!map.has(key)) {
        map.set(key, {
          nama_obat: item.nama_obat,
          total_stok: 0,
          exp_date: item.exp_date || "-",
        });
      }

      const current = map.get(key);
      current.total_stok += Number(item.stok || 0);

      if (
        item.exp_date &&
        (!current.exp_date || new Date(item.exp_date) < new Date(current.exp_date))
      ) {
        current.exp_date = item.exp_date;
      }
    });

    return Array.from(map.values());
  }, [myStok]);

  const filteredItems = useMemo(() => {
    return grouped.filter((item) => {
      const status = getStatus(item.total_stok).label;
      const matchSearch = item.nama_obat
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchStatus =
        filterStatus === "Semua" ? true : status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [grouped, search, filterStatus]);

  const pageStyle = {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  };

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e3e7ef",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  };

  const inputStyle = {
    border: "1px solid #d7deea",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    background: "#fff",
  };

  const thStyle = {
    textAlign: "left",
    padding: "12px 14px",
    background: "#f5f7fb",
    color: "#506079",
    fontWeight: 700,
    borderBottom: "1px solid #e6ebf2",
  };

  const tdStyle = {
    padding: "12px 14px",
    borderBottom: "1px solid #eef2f7",
    color: "#2c3650",
    verticalAlign: "middle",
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#1e293b",
              marginBottom: 6,
            }}
          >
            Monitor Stok
          </div>
          <div style={{ color: "#64748b", fontSize: 14 }}>
            Pantau stok aman, hampir habis, dan kritis
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <input
            type="text"
            placeholder="Cari nama obat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={inputStyle}
          >
            <option value="Semua">Semua Status</option>
            <option value="Aman">Aman</option>
            <option value="Hampir habis">Hampir habis</option>
            <option value="Kritis">Kritis</option>
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#f8fafc" }}>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 8 }}>Total Data</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>
              {filteredItems.length}
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#f8fafc" }}>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 8 }}>Kritis</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#ef4444" }}>
              {filteredItems.filter((i) => getStatus(i.total_stok).label === "Kritis").length}
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#f8fafc" }}>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 8 }}>Hampir Habis</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#eab308" }}>
              {filteredItems.filter((i) => getStatus(i.total_stok).label === "Hampir habis").length}
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#f8fafc" }}>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 8 }}>Aman</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#15803d" }}>
              {filteredItems.filter((i) => getStatus(i.total_stok).label === "Aman").length}
            </div>
          </div>
        </div>

        <div style={{ border: "1px solid #eceff5", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr>
                <th style={thStyle}>Nama Obat</th>
                <th style={thStyle}>Stok</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Expired</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, i) => {
                  const status = getStatus(item.total_stok);
                  return (
                    <tr key={i}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{item.nama_obat}</td>
                      <td style={tdStyle}>{item.total_stok}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            background: status.bg,
                            color: status.color,
                            borderRadius: 999,
                            padding: "6px 12px",
                            fontSize: 13,
                            fontWeight: 700,
                            display: "inline-block",
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td style={tdStyle}>{formatDate(item.exp_date)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td style={tdStyle} colSpan={4}>
                    Tidak ada data stok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}