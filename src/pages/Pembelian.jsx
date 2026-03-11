import React, { useEffect, useMemo, useState } from "react";
import * as api from "../services/api.js";
import Modal from "../components/Modal.jsx";

function today() { return new Date().toISOString().split("T")[0]; }
function rupiah(n) { return "Rp " + Number(n || 0).toLocaleString("id-ID"); }

export default function Pembelian({ user, reloadStok }) {
  const [list, setList] = useState([]);
  const [batch, setBatch] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState([]);
  const [busy, setBusy] = useState(false);

  const [openMaster, setOpenMaster] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);

  const [masterForm, setMasterForm] = useState({
    no_nota: "NP-" + Date.now(),
    tanggal: today(),
    supplier: "",
    alamat: "",
    kota: "",
    telepon: "",
    metode_bayar: "Transfer Bank",
    diskon: 0,
    catatan: "",
  });

  const [detailForm, setDetailForm] = useState({ id_batch: "", jumlah: 1, harga: 0 });

  async function load() {
    setBusy(true);
    try {
      const [l, b] = await Promise.all([api.getPembelian(user.id_gudang), api.getBatch()]);
      setList(l);
      setBatch(b);
    } finally {
      setBusy(false);
    }
  }

  async function loadDetail(id) {
    setBusy(true);
    try {
      setDetail(await api.getPembelianDetail(id));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, []);

  const total = useMemo(() => detail.reduce((a, d) => a + Number(d.jumlah) * Number(d.harga), 0), [detail]);

  async function saveMaster() {
    if (!masterForm.supplier) return alert("Supplier wajib");
    setBusy(true);
    try {
      const res = await api.savePembelianMaster({ ...masterForm, id_admin: user.id_admin, id_gudang: user.id_gudang });
      setOpenMaster(false);
      await load();
      const created = { ...masterForm, id: res.id };
      setSelected(created);
      await loadDetail(res.id);
      setOpenDetail(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addDetail() {
    if (!selected?.id) return;
    if (!detailForm.id_batch || !detailForm.jumlah || !detailForm.harga) return alert("Lengkapi detail");
    setBusy(true);
    try {
      await api.savePembelianDetail({
        id_pembelian: selected.id,
        id_batch: Number(detailForm.id_batch),
        jumlah: Number(detailForm.jumlah),
        harga: Number(detailForm.harga),
        id_gudang: user.id_gudang,
      });
      await loadDetail(selected.id);
      await reloadStok();
      setDetailForm({ id_batch: "", jumlah: 1, harga: 0 });
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">🛒 Pembelian</div>
          <div className="row">
            <button className="btn btn-primary" onClick={() => setOpenMaster(true)}>➕ Buat Nota</button>
            <button className="btn btn-secondary btn-sm" onClick={load} disabled={busy}>🔄 Refresh</button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>No Nota</th><th>Tanggal</th><th>Supplier</th><th>Item</th><th>Total</th><th>Aksi</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.no_nota}</b></td>
                  <td>{p.tanggal}</td>
                  <td>{p.supplier}</td>
                  <td><span className="badge badge-info">{p.total_item} item</span></td>
                  <td><b>{rupiah(p.total_harga - (p.total_harga * (p.diskon || 0) / 100))}</b></td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={async () => { setSelected(p); await loadDetail(p.id); }}>
                      📋 Detail
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 ? <tr><td colSpan={6} className="muted">Belum ada transaksi</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">📦 Detail Nota: {selected.no_nota}</div>
            <div className="row">
              <button className="btn btn-primary" onClick={() => setOpenDetail(true)}>➕ Tambah Item</button>
            </div>
          </div>

          <div className="muted" style={{ marginBottom: 10 }}>
            Supplier: <b>{selected.supplier}</b> • Tanggal: <b>{selected.tanggal}</b>
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr><th>Obat</th><th>Batch</th><th>Jumlah</th><th>Harga</th><th>Total</th></tr></thead>
              <tbody>
                {detail.map((d, i) => (
                  <tr key={i}>
                    <td><b>{d.nama_obat}</b> <span className="muted">({d.satuan})</span></td>
                    <td><span className="badge badge-info">{d.batch}</span></td>
                    <td>{Number(d.jumlah).toLocaleString("id-ID")}</td>
                    <td>{rupiah(d.harga)}</td>
                    <td><b>{rupiah(Number(d.jumlah) * Number(d.harga))}</b></td>
                  </tr>
                ))}
                {detail.length === 0 ? <tr><td colSpan={5} className="muted">Belum ada item</td></tr> : null}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, fontWeight: 900 }}>
            Total: <span style={{ color: "var(--success)" }}>{rupiah(total)}</span>
          </div>
        </div>
      ) : null}

      {openMaster ? (
        <Modal
          title="➕ Buat Nota Pembelian"
          onClose={() => setOpenMaster(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setOpenMaster(false)}>Batal</button>
              <button className="btn btn-primary" onClick={saveMaster} disabled={busy}>Simpan</button>
            </>
          }
        >
          <div className="form-grid">
            <div>
              <div className="label">No Nota</div>
              <input className="input" value={masterForm.no_nota} onChange={(e) => setMasterForm({ ...masterForm, no_nota: e.target.value })} />
            </div>
            <div>
              <div className="label">Tanggal</div>
              <input className="input" type="date" value={masterForm.tanggal} onChange={(e) => setMasterForm({ ...masterForm, tanggal: e.target.value })} />
            </div>
            <div className="col-2">
              <div className="label">Supplier *</div>
              <input className="input" value={masterForm.supplier} onChange={(e) => setMasterForm({ ...masterForm, supplier: e.target.value })} />
            </div>
            <div>
              <div className="label">Diskon (%)</div>
              <input className="input" type="number" value={masterForm.diskon} onChange={(e) => setMasterForm({ ...masterForm, diskon: Number(e.target.value) })} />
            </div>
            <div>
              <div className="label">Metode Bayar</div>
              <select value={masterForm.metode_bayar} onChange={(e) => setMasterForm({ ...masterForm, metode_bayar: e.target.value })}>
                <option>Transfer Bank</option><option>Tunai</option><option>Kredit</option>
              </select>
            </div>
            <div className="col-2">
              <div className="label">Catatan</div>
              <textarea value={masterForm.catatan} onChange={(e) => setMasterForm({ ...masterForm, catatan: e.target.value })} />
            </div>
          </div>
        </Modal>
      ) : null}

      {openDetail ? (
        <Modal
          title="➕ Tambah Item Pembelian"
          onClose={() => setOpenDetail(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setOpenDetail(false)}>Tutup</button>
              <button className="btn btn-primary" onClick={addDetail} disabled={busy}>Tambah</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="col-2">
              <div className="label">Batch *</div>
              <select value={detailForm.id_batch} onChange={(e) => setDetailForm({ ...detailForm, id_batch: e.target.value })}>
                <option value="">-- pilih batch --</option>
                {batch.map((b) => (
                  <option key={b.id_batch} value={b.id_batch}>
                    {b.nama_obat} | {b.batch} | Exp: {b.exp_date}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="label">Jumlah *</div>
              <input className="input" type="number" min="1" value={detailForm.jumlah} onChange={(e) => setDetailForm({ ...detailForm, jumlah: Number(e.target.value) })} />
            </div>
            <div>
              <div className="label">Harga *</div>
              <input className="input" type="number" min="0" value={detailForm.harga} onChange={(e) => setDetailForm({ ...detailForm, harga: Number(e.target.value) })} />
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}