// File: frontend/src/pages/Penghapusan.jsx
import React, { useMemo, useState } from "react";
import * as api from "../services/api.js";
import Modal from "../components/Modal.jsx";

function today() {
  return new Date().toISOString().split("T")[0];
}

function openPrintWindow(title, html) {
  const w = window.open("", "_blank");
  w.document.write(`
    <html><head><title>${title}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px}
        h2{margin:0 0 8px}
        .muted{color:#666;font-size:12px}
        table{width:100%;border-collapse:collapse;margin-top:10px}
        th,td{border:1px solid #ddd;padding:8px;font-size:13px}
        th{background:#f5f5f5;text-align:left}
        .right{text-align:right}
      </style>
    </head><body>${html}</body></html>
  `);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}

export default function Penghapusan({ user, stokData, reloadStok }) {
  const [busy, setBusy] = useState(false);

  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState([]);

  const [openMaster, setOpenMaster] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);

  const [masterForm, setMasterForm] = useState({
    no_hapus: "HP-" + Date.now(),
    tanggal: today(),
    alasan: "",
  });

  const [detailForm, setDetailForm] = useState({ id_batch: "", jumlah: 1 });

  const myStok = useMemo(() => {
    return stokData
      .filter((s) => String(s.id_gudang) === String(user.id_gudang))
      .filter((s) => Number(s.stok || 0) > 0);
  }, [stokData, user.id_gudang]);

  async function load() {
    setBusy(true);
    try {
      setList(await api.getPenghapusan(user.id_gudang));
    } finally {
      setBusy(false);
    }
  }

  async function loadDetail(id) {
    setBusy(true);
    try {
      setDetail(await api.getPenghapusanDetail(id));
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  async function saveMaster() {
    if (!masterForm.tanggal) return alert("Tanggal wajib");
    if (!masterForm.alasan) return alert("Alasan wajib");
    setBusy(true);
    try {
      const res = await api.savePenghapusanMaster({
        ...masterForm,
        id_admin: user.id_admin,
        id_gudang: user.id_gudang,
      });

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
    if (!detailForm.id_batch || !detailForm.jumlah) return alert("Lengkapi detail");
    setBusy(true);
    try {
      await api.savePenghapusanDetail({
        id_hapus: selected.id,
        id_batch: Number(detailForm.id_batch),
        jumlah: Number(detailForm.jumlah),
        id_gudang: user.id_gudang,
      });

      await loadDetail(selected.id);
      await reloadStok();
      setDetailForm({ id_batch: "", jumlah: 1 });
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  function printNota() {
    if (!selected) return;
    const rows = detail
      .map(
        (d, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><b>${d.nama_obat}</b><div class="muted">${d.satuan || ""}</div></td>
            <td>${d.batch}</td>
            <td class="right">${Number(d.jumlah).toLocaleString("id-ID")}</td>
          </tr>
        `
      )
      .join("");

    openPrintWindow(
      "Berita Acara Penghapusan",
      `
        <h2>BERITA ACARA PENGHAPUSAN</h2>
        <div class="muted">SIGO – Sistem Informasi Gudang Obat</div>
        <hr/>
        <div><b>No:</b> ${selected.no_hapus}</div>
        <div><b>Tanggal:</b> ${selected.tanggal}</div>
        <div><b>Alasan:</b> ${selected.alasan}</div>
        <table>
          <thead><tr><th>No</th><th>Obat</th><th>Batch</th><th class="right">Jumlah</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="4">Belum ada item</td></tr>`}</tbody>
        </table>
        <br/>
        <div style="display:flex;justify-content:space-between;margin-top:30px">
          <div style="text-align:center">Petugas Gudang<br/><br/><br/>(____________)</div>
          <div style="text-align:center">Mengetahui<br/><br/><br/>(____________)</div>
        </div>
      `
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">🗑️ Penghapusan</div>
          <div className="row">
            <button className="btn btn-danger" onClick={() => setOpenMaster(true)}>
              ➕ Buat Penghapusan
            </button>
            <button className="btn btn-secondary btn-sm" onClick={load} disabled={busy}>
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Alasan</th>
                <th>Item</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((h) => (
                <tr key={h.id}>
                  <td>
                    <b>{h.no_hapus}</b>
                  </td>
                  <td>{h.tanggal}</td>
                  <td>{h.alasan}</td>
                  <td>
                    <span className="badge badge-danger">{h.total_item} item</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={async () => {
                        setSelected(h);
                        await loadDetail(h.id);
                      }}
                    >
                      📋 Detail
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Belum ada penghapusan
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">📦 Detail: {selected.no_hapus}</div>
            <div className="row">
              <button className="btn btn-danger" onClick={() => setOpenDetail(true)}>
                ➕ Tambah Item
              </button>
              <button className="btn btn-secondary" onClick={printNota}>
                🖨️ Cetak BA
              </button>
            </div>
          </div>

          <div className="muted" style={{ marginBottom: 10 }}>
            Tanggal: <b>{selected.tanggal}</b> • Alasan: <b>{selected.alasan || "-"}</b>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Obat</th>
                  <th>Batch</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {detail.map((d, i) => (
                  <tr key={i}>
                    <td>
                      <b>{d.nama_obat}</b> <span className="muted">({d.satuan})</span>
                    </td>
                    <td>
                      <span className="badge badge-danger">{d.batch}</span>
                    </td>
                    <td>
                      <b>{Number(d.jumlah).toLocaleString("id-ID")}</b>
                    </td>
                  </tr>
                ))}
                {detail.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="muted">
                      Belum ada item
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {openMaster ? (
        <Modal
          title="➕ Buat Penghapusan"
          onClose={() => setOpenMaster(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setOpenMaster(false)}>
                Batal
              </button>
              <button className="btn btn-danger" onClick={saveMaster} disabled={busy}>
                Simpan
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div>
              <div className="label">No Penghapusan</div>
              <input className="input" value={masterForm.no_hapus} onChange={(e) => setMasterForm({ ...masterForm, no_hapus: e.target.value })} />
            </div>
            <div>
              <div className="label">Tanggal</div>
              <input className="input" type="date" value={masterForm.tanggal} onChange={(e) => setMasterForm({ ...masterForm, tanggal: e.target.value })} />
            </div>
            <div className="col-2">
              <div className="label">Alasan *</div>
              <textarea value={masterForm.alasan} onChange={(e) => setMasterForm({ ...masterForm, alasan: e.target.value })} />
            </div>
          </div>
        </Modal>
      ) : null}

      {openDetail ? (
        <Modal
          title="➕ Tambah Item Penghapusan"
          onClose={() => setOpenDetail(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setOpenDetail(false)}>
                Tutup
              </button>
              <button className="btn btn-danger" onClick={addDetail} disabled={busy}>
                Tambah
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="col-2">
              <div className="label">Batch dari stok gudang *</div>
              <select value={detailForm.id_batch} onChange={(e) => setDetailForm({ ...detailForm, id_batch: e.target.value })}>
                <option value="">-- pilih batch --</option>
                {myStok.map((s) => (
                  <option key={s.id_batch} value={s.id_batch}>
                    {s.nama_obat} | Batch:{s.batch} | Stok:{s.stok} | Exp:{s.exp_date}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="label">Jumlah *</div>
              <input className="input" type="number" min="1" value={detailForm.jumlah} onChange={(e) => setDetailForm({ ...detailForm, jumlah: Number(e.target.value) })} />
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}