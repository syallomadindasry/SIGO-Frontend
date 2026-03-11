// File: frontend/src/pages/Laporan.jsx
import React, { useEffect, useMemo, useState } from "react";
import * as api from "../services/api.js";

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 1);
  x.setDate(0);
  x.setHours(23, 59, 59, 999);
  return x;
}
function toYMD(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatMonthLabel(ym) {
  const [y, m] = ym.split("-").map((v) => parseInt(v, 10));
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}
function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}
function downloadCSV(filename, rows) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell ?? "");
          const escaped = s.replaceAll('"', '""');
          return `"${escaped}"`;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Laporan({ user, gudangList = [], stokData = [] }) {
  // ====== STOK ======
  const [stokLocal, setStokLocal] = useState(Array.isArray(stokData) ? stokData : []);
  const [stokLoading, setStokLoading] = useState(false);
  const [stokError, setStokError] = useState("");

  const canFilterGudang = user?.role === "dinkes";
  const [filterGudang, setFilterGudang] = useState(
    canFilterGudang ? "0" : String(user?.id_gudang || 0),
  );

  // kalau props stokData berubah (setelah reloadStok), ikut update
  useEffect(() => {
    if (Array.isArray(stokData) && stokData.length) setStokLocal(stokData);
  }, [stokData]);

  // self-fetch kalau kosong
  useEffect(() => {
    let mounted = true;
    async function loadIfEmpty() {
      if (stokLocal?.length) return;
      setStokLoading(true);
      setStokError("");
      try {
        const res = await api.getStok(0);
        if (!mounted) return;
        setStokLocal(Array.isArray(res) ? res : []);
      } catch (e) {
        if (!mounted) return;
        setStokError(e?.message || "Gagal mengambil data stok.");
        setStokLocal([]);
      } finally {
        if (mounted) setStokLoading(false);
      }
    }
    loadIfEmpty();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stokFiltered = useMemo(() => {
    const list = Array.isArray(stokLocal) ? stokLocal : [];
    const gid = parseInt(filterGudang, 10);

    // dinkes: bisa semua gudang / pilih satu
    if (user?.role === "dinkes") {
      if (gid === 0) return list;
      return list.filter((s) => String(s.id_gudang) === String(gid));
    }

    // puskesmas: hanya gudang sendiri
    return list.filter((s) => String(s.id_gudang) === String(user?.id_gudang));
  }, [stokLocal, filterGudang, user]);

  // aggregate stok per obat (gabung semua batch)
  const stokAgg = useMemo(() => {
    const map = new Map();
    for (const s of stokFiltered) {
      const key = `${s.nama_obat}||${s.satuan || ""}`;
      const prev = map.get(key) || {
        nama_obat: s.nama_obat,
        satuan: s.satuan || "-",
        total: 0,
        minStok: Infinity,
        anyLow: false,
      };
      const st = safeNum(s.stok);
      prev.total += st;
      prev.minStok = Math.min(prev.minStok, st);
      prev.anyLow = prev.anyLow || st < 100;
      map.set(key, prev);
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [stokFiltered]);

  const stokMax = useMemo(() => {
    return stokAgg.reduce((m, x) => Math.max(m, x.total), 0) || 1;
  }, [stokAgg]);

  // ====== TRANSAKSI ======
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");

  const [pembelian, setPembelian] = useState([]);
  const [distribusi, setDistribusi] = useState([]);
  const [retur, setRetur] = useState([]);
  const [penghapusan, setPenghapusan] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadTx() {
      setTxLoading(true);
      setTxError("");
      try {
        // untuk dinkes: ambil semua (0)
        // untuk puskesmas: ambil gudang sendiri
        const gid = user?.role === "dinkes" ? 0 : user?.id_gudang;

        const [a, b, c, d] = await Promise.all([
          api.getPembelian(gid),
          api.getDistribusi(gid),
          api.getRetur(gid),
          api.getPenghapusan(gid),
        ]);

        if (!mounted) return;
        setPembelian(Array.isArray(a) ? a : []);
        setDistribusi(Array.isArray(b) ? b : []);
        setRetur(Array.isArray(c) ? c : []);
        setPenghapusan(Array.isArray(d) ? d : []);
      } catch (e) {
        if (!mounted) return;
        setTxError(e?.message || "Gagal mengambil data transaksi.");
        setPembelian([]);
        setDistribusi([]);
        setRetur([]);
        setPenghapusan([]);
      } finally {
        if (mounted) setTxLoading(false);
      }
    }
    loadTx();
    return () => {
      mounted = false;
    };
  }, [user]);

  const periodRange = useMemo(() => {
    const d = new Date(`${period}-01T00:00:00`);
    return {
      from: startOfMonth(d),
      to: endOfMonth(d),
    };
  }, [period]);

  function inRangeByTanggal(row) {
    // backend kamu ada yang pakai field "tanggal"
    // beberapa list mungkin pakai "tgl" / "created_at"
    // kita bikin toleran:
    const t =
      row?.tanggal ||
      row?.tgl ||
      row?.created_at ||
      row?.createdAt ||
      row?.waktu ||
      null;
    if (!t) return false;
    const dt = new Date(t);
    return dt >= periodRange.from && dt <= periodRange.to;
  }

  const txSummary = useMemo(() => {
    const pembelianCount = pembelian.filter(inRangeByTanggal).length;
    const distribusiCount = distribusi.filter(inRangeByTanggal).length;
    const returCount = retur.filter(inRangeByTanggal).length;
    const penghapusanCount = penghapusan.filter(inRangeByTanggal).length;

    return { pembelianCount, distribusiCount, returCount, penghapusanCount };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pembelian, distribusi, retur, penghapusan, periodRange]);

  const periodOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      opts.push(ym);
    }
    return opts;
  }, []);

  // ====== EXPORTS ======
  function exportStokCSV() {
    const rows = [
      ["Nama Obat", "Satuan", "Total Stok"],
      ...stokAgg.map((x) => [x.nama_obat, x.satuan, x.total]),
    ];
    const gLabel =
      user?.role === "dinkes" && String(filterGudang) !== "0"
        ? (gudangList.find((g) => String(g.id_gudang) === String(filterGudang))?.nama_gudang ||
            `Gudang-${filterGudang}`)
        : "SemuaGudang";
    downloadCSV(`laporan-stok-${gLabel}-${toYMD(new Date())}.csv`, rows);
  }

  function exportTransaksiCSV() {
    const rows = [
      ["Periode", "Jenis", "Jumlah"],
      [formatMonthLabel(period), "Pembelian", txSummary.pembelianCount],
      [formatMonthLabel(period), "Distribusi", txSummary.distribusiCount],
      [formatMonthLabel(period), "Retur", txSummary.returCount],
      [formatMonthLabel(period), "Penghapusan", txSummary.penghapusanCount],
    ];
    downloadCSV(`laporan-transaksi-${period}-${toYMD(new Date())}.csv`, rows);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 18 }}>
      {/* ===== LEFT: STOK ===== */}
      <div className="card" style={{ padding: 0 }}>
        <div
          className="card-header"
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid var(--border)",
            marginBottom: 0,
          }}
        >
          <div>
            <div className="card-title" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span>📊</span> Laporan Stok Obat
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Gudang:{" "}
              <b>
                {user?.role === "dinkes"
                  ? String(filterGudang) === "0"
                    ? "Semua Gudang"
                    : gudangList.find((g) => String(g.id_gudang) === String(filterGudang))
                        ?.nama_gudang || `Gudang ${filterGudang}`
                  : gudangList.find((g) => String(g.id_gudang) === String(user?.id_gudang))
                      ?.nama_gudang || `Gudang ${user?.id_gudang}`}
              </b>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {canFilterGudang && (
              <select
                value={filterGudang}
                onChange={(e) => setFilterGudang(e.target.value)}
                style={{
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "white",
                  fontFamily: "inherit",
                  fontSize: 13,
                  minWidth: 220,
                }}
              >
                <option value="0">Semua Gudang</option>
                {gudangList.map((g) => (
                  <option key={g.id_gudang} value={g.id_gudang}>
                    {g.nama_gudang}
                  </option>
                ))}
              </select>
            )}

            <button className="btn btn-secondary btn-sm" onClick={exportStokCSV} disabled={!stokAgg.length}>
              ⬇ Export
            </button>
          </div>
        </div>

        <div style={{ padding: "14px 18px 18px" }}>
          {stokLoading ? (
            <div className="loading">⏳ Memuat stok...</div>
          ) : stokError ? (
            <div className="alert alert-danger">⚠️ {stokError}</div>
          ) : stokAgg.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>Tidak ada data stok untuk filter ini.</p>
              <p style={{ marginTop: 6, fontSize: 12 }}>
                Jika kamu yakin ada data: cek bahwa request <code>api.getStok()</code> tidak error.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stokAgg.slice(0, 12).map((x, idx) => {
                const pct = Math.max(2, Math.round((x.total / stokMax) * 100));
                const danger = x.anyLow || x.minStok < 100;
                return (
                  <div key={`${x.nama_obat}-${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 700 }}>{x.nama_obat}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                          <b>{x.total.toLocaleString("id-ID")}</b> {x.satuan}
                        </div>
                      </div>

                      <div style={{ marginTop: 8, height: 8, borderRadius: 999, background: "#E2E8F0", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            borderRadius: 999,
                            background: danger ? "var(--danger)" : "var(--accent)",
                          }}
                        />
                      </div>

                      {danger && (
                        <div style={{ marginTop: 6, fontSize: 12, color: "var(--danger)", fontWeight: 700 }}>
                          ⚠️ Ada batch stok &lt; 100
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: "right", alignSelf: "center" }}>
                      <span className={`badge ${danger ? "badge-danger" : "badge-success"}`}>
                        {danger ? "Perlu perhatian" : "Aman"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== RIGHT: TRANSAKSI ===== */}
      <div className="card" style={{ padding: 0 }}>
        <div
          className="card-header"
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid var(--border)",
            marginBottom: 0,
          }}
        >
          <div>
            <div className="card-title" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span>🧾</span> Laporan Transaksi
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Ringkasan transaksi per periode
            </div>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={exportTransaksiCSV} disabled={txLoading}>
            ⬇ Export
          </button>
        </div>

        <div style={{ padding: "14px 18px 18px" }}>
          {txError ? <div className="alert alert-danger">⚠️ {txError}</div> : null}

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Periode</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "white",
                fontFamily: "inherit",
                fontSize: 14,
              }}
            >
              {periodOptions.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </option>
              ))}
            </select>
          </div>

          {txLoading ? (
            <div className="loading">⏳ Memuat transaksi...</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Jenis</th>
                    <th style={{ textAlign: "right" }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Pembelian</td>
                    <td style={{ textAlign: "right", fontWeight: 800 }}>
                      {txSummary.pembelianCount} transaksi
                    </td>
                  </tr>
                  <tr>
                    <td>Distribusi</td>
                    <td style={{ textAlign: "right", fontWeight: 800 }}>
                      {txSummary.distribusiCount} mutasi
                    </td>
                  </tr>
                  <tr>
                    <td>Retur</td>
                    <td style={{ textAlign: "right", fontWeight: 800 }}>
                      {txSummary.returCount} retur
                    </td>
                  </tr>
                  <tr>
                    <td>Penghapusan</td>
                    <td style={{ textAlign: "right", fontWeight: 800 }}>
                      {txSummary.penghapusanCount} item
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}