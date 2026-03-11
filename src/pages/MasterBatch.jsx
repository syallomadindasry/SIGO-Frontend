import React, { useEffect, useMemo, useState } from "react";
import * as api from "../services/api.js";
import Modal from "../components/Modal.jsx";

export default function MasterBatch() {
  const [list, setList] = useState([]);
  const [obat, setObat] = useState([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ batch: "", id_obat: "", exp_date: "" });

  async function load() {
    setBusy(true);
    try {
      const [b, o] = await Promise.all([api.getBatch(), api.getObat("")]);
      setList(b);
      setObat(o);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return list;
    return list.filter((b) =>
      (b.batch || "").toLowerCase().includes(q.toLowerCase()) ||
      (b.nama_obat || "").toLowerCase().includes(q.toLowerCase())
    );
  }, [list, q]);

  async function save() {
    if (!form.batch || !form.id_obat || !form.exp_date) return alert("Lengkapi semua field");
    setBusy(true);
    try {
      await api.addBatch({ batch: form.batch, id_obat: Number(form.id_obat), exp_date: form.exp_date });
      setOpen(false);
      setForm({ batch: "", id_obat: "", exp_date: "" });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🏷️ Master Batch</div>
        <div className="row">
          <input className="input" style={{ width: 260 }} placeholder="Cari batch/obat..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setOpen(true)}>➕ Tambah Batch</button>
        </div>
      </div>

      {busy ? <div className="muted">⏳ Memuat...</div> : null}

      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Batch</th><th>Obat</th><th>Satuan</th><th>Expired</th></tr></thead>
          <tbody>
            {filtered.map((b, i) => (
              <tr key={b.id_batch}>
                <td className="muted">{i + 1}</td>
                <td><span className="badge badge-info">{b.batch}</span></td>
                <td><b>{b.nama_obat}</b><div className="muted" style={{ fontSize: 12 }}>{b.jenis || "-"}</div></td>
                <td>{b.satuan}</td>
                <td>{b.exp_date}</td>
              </tr>
            ))}
            {filtered.length === 0 ? <tr><td colSpan={5} className="muted">Tidak ada data</td></tr> : null}
          </tbody>
        </table>
      </div>

      {open ? (
        <Modal
          title="➕ Tambah Batch"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setOpen(false)}>Batal</button>
              <button className="btn btn-primary" onClick={save} disabled={busy}>Simpan</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="col-2">
              <div className="label">Obat *</div>
              <select value={form.id_obat} onChange={(e) => setForm({ ...form, id_obat: e.target.value })}>
                <option value="">-- pilih obat --</option>
                {obat.map((o) => (
                  <option key={o.id_obat} value={o.id_obat}>{o.nama} ({o.satuan})</option>
                ))}
              </select>
            </div>
            <div>
              <div className="label">Batch *</div>
              <input className="input" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
            </div>
            <div>
              <div className="label">Expired *</div>
              <input className="input" type="date" value={form.exp_date} onChange={(e) => setForm({ ...form, exp_date: e.target.value })} />
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}