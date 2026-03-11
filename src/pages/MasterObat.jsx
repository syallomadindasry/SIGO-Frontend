import React, { useEffect, useMemo, useState } from "react";
import * as api from "../services/api.js";
import Modal from "../components/Modal.jsx";

export default function MasterObat() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nama: "", satuan: "", jenis: "" });

  async function load() {
    setBusy(true);
    try {
      setList(await api.getObat(q));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  const filtered = useMemo(() => {
    if (!q.trim()) return list;
    return list.filter((o) =>
      (o.nama || "").toLowerCase().includes(q.toLowerCase()) ||
      (o.jenis || "").toLowerCase().includes(q.toLowerCase())
    );
  }, [list, q]);

  async function save() {
    if (!form.nama || !form.satuan) return alert("Nama & Satuan wajib diisi");
    setBusy(true);
    try {
      if (editId) await api.editObat({ ...form, id_obat: editId });
      else await api.addObat(form);
      setOpen(false);
      setEditId(null);
      setForm({ nama: "", satuan: "", jenis: "" });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function del(id) {
    if (!confirm("Hapus obat ini?")) return;
    setBusy(true);
    try {
      await api.deleteObat(id);
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
        <div className="card-title">💊 Master Obat</div>
        <div className="row">
          <input className="input" style={{ width: 260 }} placeholder="Cari..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={busy}>🔍 Cari</button>
          <button className="btn btn-primary" onClick={() => { setOpen(true); setEditId(null); setForm({ nama: "", satuan: "", jenis: "" }); }}>
            ➕ Tambah
          </button>
        </div>
      </div>

      {busy ? <div className="muted">⏳ Memuat...</div> : null}

      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Nama</th><th>Satuan</th><th>Jenis</th><th>Aksi</th></tr></thead>
          <tbody>
            {filtered.map((o, i) => (
              <tr key={o.id_obat}>
                <td className="muted">{i + 1}</td>
                <td><b>{o.nama}</b></td>
                <td><span className="badge badge-info">{o.satuan}</span></td>
                <td>{o.jenis || "-"}</td>
                <td>
                  <button className="btn btn-warning btn-sm" onClick={() => { setOpen(true); setEditId(o.id_obat); setForm({ nama: o.nama, satuan: o.satuan, jenis: o.jenis || "" }); }}>
                    ✏️ Edit
                  </button>{" "}
                  <button className="btn btn-danger btn-sm" onClick={() => del(o.id_obat)}>🗑️ Hapus</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? <tr><td colSpan={5} className="muted">Tidak ada data</td></tr> : null}
          </tbody>
        </table>
      </div>

      {open ? (
        <Modal
          title={editId ? "✏️ Edit Obat" : "➕ Tambah Obat"}
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
              <div className="label">Nama *</div>
              <input className="input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div>
              <div className="label">Satuan *</div>
              <input className="input" value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} />
            </div>
            <div>
              <div className="label">Jenis</div>
              <input className="input" value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })} />
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}