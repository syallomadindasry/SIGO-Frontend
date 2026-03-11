import React, { useMemo, useState } from "react";

export default function StokMonitor({ user, gudangList, stokData, reloadStok }) {
  const [filterGudang, setFilterGudang] = useState(String(user.id_gudang));
  const [q, setQ] = useState("");

  const data = useMemo(() => {
    return stokData
      .filter((s) => String(s.id_gudang) === String(filterGudang))
      .filter((s) => (s.nama_obat || "").toLowerCase().includes(q.toLowerCase()) || (s.batch || "").toLowerCase().includes(q.toLowerCase()));
  }, [stokData, filterGudang, q]);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">📦 Monitor Stok</div>
        <div className="row">
          <input className="input" style={{ width: 240 }} placeholder="Cari obat/batch..." value={q} onChange={(e) => setQ(e.target.value)} />
          {user.role === "dinkes" ? (
            <select value={filterGudang} onChange={(e) => setFilterGudang(e.target.value)}>
              {gudangList.map((g) => (
                <option key={g.id_gudang} value={g.id_gudang}>{g.nama_gudang}</option>
              ))}
            </select>
          ) : null}
          <button className="btn btn-secondary btn-sm" onClick={reloadStok}>🔄 Refresh</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Obat</th><th>Satuan</th><th>Batch</th><th>Expired</th><th>Stok</th><th>Gudang</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, i) => (
              <tr key={`${s.id_gudang}-${s.id_batch}`}>
                <td className="muted">{i + 1}</td>
                <td><b>{s.nama_obat}</b><div className="muted" style={{ fontSize: 12 }}>{s.jenis || "-"}</div></td>
                <td>{s.satuan}</td>
                <td><span className="badge badge-info">{s.batch}</span></td>
                <td>{s.exp_date}</td>
                <td>
                  <span className={`badge ${Number(s.stok) < 100 ? "badge-danger" : Number(s.stok) < 500 ? "badge-warning" : "badge-success"}`}>
                    {Number(s.stok).toLocaleString("id-ID")}
                  </span>
                </td>
                <td>{s.nama_gudang}</td>
              </tr>
            ))}
            {data.length === 0 ? <tr><td colSpan={7} className="muted">Tidak ada data</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}