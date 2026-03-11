import React, { useMemo } from "react";

function isExpiringSoon(exp) {
  const d = (new Date(exp) - new Date()) / 86400000;
  return d < 30 && d > 0;
}
function isExpired(exp) {
  return new Date(exp) < new Date();
}

export default function Dashboard({ user, stokData }) {
  const myStok = useMemo(() => stokData.filter((s) => String(s.id_gudang) === String(user.id_gudang)), [stokData, user]);
  const kritis = useMemo(() => myStok.filter((s) => Number(s.stok) < 100), [myStok]);
  const expiring = useMemo(() => stokData.filter((s) => isExpiringSoon(s.exp_date)), [stokData]);
  const expired = useMemo(() => stokData.filter((s) => isExpired(s.exp_date)), [stokData]);
  const totalStok = useMemo(() => myStok.reduce((a, s) => a + Number(s.stok || 0), 0), [myStok]);

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="muted">Total Item</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{myStok.length}</div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <div className="muted">Stok Kritis (&lt;100)</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--danger)" }}>{kritis.length}</div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <div className="muted">Segera Expired (&lt;30 hari)</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--warning)" }}>{expiring.length}</div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <div className="muted">Total Stok</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--success)" }}>{totalStok.toLocaleString("id-ID")}</div>
        </div>
      </div>

      {kritis.length > 0 ? (
        <div className="card" style={{ borderColor: "#FEB2B2", background: "#FED7D7" }}>
          ⚠️ <b>{kritis.length} item</b> stok kritis. Segera lakukan pengadaan.
        </div>
      ) : null}

      <div className="row" style={{ alignItems: "stretch" }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div className="card-title">🔴 Stok Kritis</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Obat</th><th>Batch</th><th>Stok</th></tr>
              </thead>
              <tbody>
                {kritis.slice(0, 10).map((s, i) => (
                  <tr key={i}>
                    <td><b>{s.nama_obat}</b></td>
                    <td>{s.batch}</td>
                    <td><span className="badge badge-danger">{s.stok}</span></td>
                  </tr>
                ))}
                {kritis.length === 0 ? <tr><td colSpan={3} className="muted">Aman ✅</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div className="card-title">⏳ Expired / Segera Expired</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Obat</th><th>Batch</th><th>Expired</th></tr>
              </thead>
              <tbody>
                {expired.concat(expiring).slice(0, 10).map((s, i) => (
                  <tr key={i}>
                    <td><b>{s.nama_obat}</b></td>
                    <td>{s.batch}</td>
                    <td><span className={`badge ${isExpired(s.exp_date) ? "badge-danger" : "badge-warning"}`}>{s.exp_date}</span></td>
                  </tr>
                ))}
                {expired.length === 0 && expiring.length === 0 ? <tr><td colSpan={3} className="muted">Tidak ada ✅</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}