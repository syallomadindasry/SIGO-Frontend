// =====================================================
// File: SIGOO/SIGO/frontend/src/components/StokMonitor.jsx
// Card dibuat lebih kecil agar tidak memakan tempat
// =====================================================
import React, { useEffect, useMemo, useState } from "react";

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function formatNumberId(n) {
  return toNumber(n, 0).toLocaleString("id-ID");
}
function formatDateId(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
function safeLower(s) {
  return String(s ?? "").toLowerCase();
}
function toneStyles(tone) {
  if (tone === "danger") return { fg: "#b91c1c", bg: "#fee2e2", border: "#fecaca" };
  if (tone === "warning") return { fg: "#a16207", bg: "#fef3c7", border: "#fde68a" };
  return { fg: "#15803d", bg: "#dcfce7", border: "#bbf7d0" };
}
function getStatusByMinLow(stok, minStok, lowStok) {
  const s = toNumber(stok, 0);
  const min = Math.max(1, toNumber(minStok, 100));
  const low = Math.max(min, toNumber(lowStok, min * 2));
  if (s < min) return { label: "Kritis", tone: "danger" };
  if (s < low) return { label: "Rendah", tone: "warning" };
  return { label: "Normal", tone: "success" };
}
function getProgressPercent(stok, minStok) {
  const s = Math.max(0, toNumber(stok, 0));
  const m = Math.max(1, toNumber(minStok, 100));
  return Math.max(0, Math.min(100, (s / (m * 4)) * 100));
}
async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} (${res.url})`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Not JSON (${res.url}): ${text.slice(0, 200)}`);
  }
}
function groupRowsByObat(rows) {
  const map = new Map();
  for (const r of rows) {
    const idObat = String(r.id_obat ?? "");
    if (!idObat) continue;

    if (!map.has(idObat)) {
      map.set(idObat, {
        key: idObat,
        id_obat: r.id_obat,
        kode_obat: r.kode_obat || `OBT-${String(idObat).padStart(3, "0")}`,
        nama_obat: r.nama_obat ?? "-",
        kategori: r.jenis ?? "-",
        satuan: r.satuan ?? "-",
        harga: toNumber(r.harga, 0),
        min_stok: toNumber(r.min_stok, 100),
        low_stok: toNumber(r.low_stok, 200),
        total_stok: 0,
        exp_terdekat: r.exp_date ?? null,
      });
    }

    const cur = map.get(idObat);
    cur.total_stok += toNumber(r.stok, 0);

    if (r.exp_date) {
      if (!cur.exp_terdekat) cur.exp_terdekat = r.exp_date;
      else {
        const a = new Date(r.exp_date);
        const b = new Date(cur.exp_terdekat);
        if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) && a < b) cur.exp_terdekat = r.exp_date;
      }
    }
  }
  return Array.from(map.values());
}
function getBatchBadge(expDate, now = new Date(), warnDays = 30) {
  const d = new Date(expDate);
  if (Number.isNaN(d.getTime())) return { label: "Aktif", tone: "success" };
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Expired", tone: "danger" };
  if (diffDays <= warnDays) return { label: "Peringatan", tone: "warning" };
  return { label: "Aktif", tone: "success" };
}

export default function StokMonitor({ user }) {
  const listApiUrl = "/api/stok_batch.php";
  const detailApiUrl = "/api/stok_detail.php";

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailData, setDetailData] = useState(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const isDinkes = user?.role === "dinkes" || user?.warehouse?.type === "DINKES";
        const idGudang = isDinkes ? 0 : toNumber(user?.id_gudang, 0);
        const url = idGudang ? `${listApiUrl}?id_gudang=${encodeURIComponent(idGudang)}` : listApiUrl;

        const data = await fetchJson(url);
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setError(String(e?.message || e));
        setRows([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [user]);

  const items = useMemo(() => {
    return groupRowsByObat(rows).map((it) => {
      const status = getStatusByMinLow(it.total_stok, it.min_stok, it.low_stok);
      const progress = getProgressPercent(it.total_stok, it.min_stok);
      return { ...it, status, progress };
    });
  }, [rows]);

  const kategoriOptions = useMemo(() => {
    const set = new Set(items.map((g) => g.kategori).filter((k) => k && k !== "-"));
    return ["Semua", ...Array.from(set).sort((a, b) => a.localeCompare(b, "id-ID"))];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = safeLower(search);
    return items
      .filter((item) => {
        const matchSearch =
          !q ||
          safeLower(item.nama_obat).includes(q) ||
          safeLower(item.kategori).includes(q) ||
          safeLower(item.kode_obat).includes(q);

        const matchStatus = filterStatus === "Semua" ? true : item.status.label === filterStatus;
        const matchKategori = filterKategori === "Semua" ? true : item.kategori === filterKategori;
        return matchSearch && matchStatus && matchKategori;
      })
      .sort((a, b) => {
        const prio = { Kritis: 0, Rendah: 1, Normal: 2 };
        const pa = prio[a.status.label] ?? 9;
        const pb = prio[b.status.label] ?? 9;
        if (pa !== pb) return pa - pb;
        return String(a.nama_obat).localeCompare(String(b.nama_obat), "id-ID");
      });
  }, [items, search, filterStatus, filterKategori]);

  const summary = useMemo(() => {
    const totalItem = filteredItems.length;
    const totalStok = filteredItems.reduce((acc, it) => acc + toNumber(it.total_stok, 0), 0);
    const kritis = filteredItems.filter((it) => it.status.label === "Kritis").length;
    const rendah = filteredItems.filter((it) => it.status.label === "Rendah").length;
    return { totalItem, totalStok, kritis, rendah };
  }, [filteredItems]);

  async function openDetail(item) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailData(null);

    try {
      const isDinkes = user?.role === "dinkes" || user?.warehouse?.type === "DINKES";
      const idGudang = isDinkes ? 0 : toNumber(user?.id_gudang, 0);
      const url =
        `${detailApiUrl}?id_obat=${encodeURIComponent(item.id_obat)}` +
        (idGudang ? `&id_gudang=${encodeURIComponent(idGudang)}` : "");
      const data = await fetchJson(url);
      setDetailData(data);
    } catch (e) {
      setDetailError(String(e?.message || e));
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailOpen(false);
    setDetailData(null);
    setDetailError("");
    setDetailLoading(false);
  }

  const styles = {
    page: {
      padding: 24,
      background: "#f3f6fb",
      minHeight: "100vh",
      color: "#0f172a",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
    },
    shell: {
      maxWidth: 1200,
      margin: "0 auto",
      background: "#fff",
      border: "1px solid #e5eaf3",
      borderRadius: 18,
      boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
      padding: 20,
    },
    title: { fontSize: 28, fontWeight: 900, margin: 0 },
    subtitle: { marginTop: 6, color: "#64748b", fontSize: 14 },

    // ✅ SMALLER CARDS
    cards: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: 10,
      marginTop: 14,
    },
    card: {
      background: "#fff",
      border: "1px solid #e8edf6",
      borderRadius: 14,
      padding: 12,
      boxShadow: "0 8px 18px rgba(15, 23, 42, 0.05)",
      position: "relative",
      overflow: "hidden",
      minHeight: 112,
    },
    cardTopLine: (c) => ({ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c }),
    cardIcon: (bg) => ({
      width: 34,
      height: 34,
      borderRadius: 10,
      display: "grid",
      placeItems: "center",
      background: bg,
      marginBottom: 8,
      border: "1px solid #eef2f7",
      fontSize: 16,
    }),
    cardLabel: { fontSize: 11, fontWeight: 900, color: "#64748b", letterSpacing: 0.25 },
    cardValue: { fontSize: 26, fontWeight: 1000, marginTop: 4, lineHeight: 1.05 },
    cardHint: { marginTop: 4, fontSize: 11, color: "#94a3b8" },

    filters: { display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginTop: 12, marginBottom: 12 },
    input: {
      width: "100%",
      borderRadius: 12,
      border: "1px solid #d7deea",
      padding: "10px 14px",
      outline: "none",
      fontSize: 14,
      background: "#fff",
    },

    tableWrap: { border: "1px solid #e9eef7", borderRadius: 16, overflow: "hidden", background: "#fff" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
    th: {
      textAlign: "left",
      padding: "12px 14px",
      background: "#f6f8fc",
      color: "#506079",
      fontWeight: 1000,
      borderBottom: "1px solid #e6ebf2",
      fontSize: 12,
      letterSpacing: 0.2,
    },
    td: { padding: "12px 14px", borderBottom: "1px solid #eef2f7", verticalAlign: "middle", color: "#1f2937" },
    code: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", color: "#64748b" },
    name: { fontWeight: 900, color: "#0f172a" },
    catPill: {
      display: "inline-block",
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      color: "#1d4ed8",
      background: "#eaf2ff",
      border: "1px solid #dbeafe",
      whiteSpace: "nowrap",
    },
    badge: (tone) => {
      const t = toneStyles(tone);
      return {
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 1000,
        color: t.fg,
        background: t.bg,
        border: `1px solid ${t.border}`,
        whiteSpace: "nowrap",
      };
    },
    progressTrack: { height: 8, background: "#eef2f7", borderRadius: 999, overflow: "hidden", width: 140 },
    progressBar: (tone, pct) => ({
      height: "100%",
      width: `${pct}%`,
      background: toneStyles(tone).fg,
      borderRadius: 999,
    }),
    progressText: { marginTop: 6, fontSize: 12, color: "#94a3b8", fontWeight: 900 },

    btn: {
      border: "none",
      borderRadius: 10,
      padding: "8px 12px",
      fontWeight: 1000,
      fontSize: 13,
      cursor: "pointer",
      background: "#15803d",
      color: "#fff",
      boxShadow: "0 10px 18px rgba(21, 128, 61, 0.18)",
    },

    info: { marginTop: 10, color: "#64748b", fontWeight: 800, fontSize: 13 },

    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.55)",
      display: "grid",
      placeItems: "center",
      padding: 18,
      zIndex: 50,
    },
    modal: {
      width: "min(980px, 100%)",
      background: "#fff",
      borderRadius: 18,
      border: "1px solid #e5eaf3",
      boxShadow: "0 30px 80px rgba(15, 23, 42, 0.35)",
      overflow: "hidden",
    },
    modalHead: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 16px",
      borderBottom: "1px solid #eef2f7",
    },
    modalTitle: { display: "flex", alignItems: "center", gap: 10, fontWeight: 1000, fontSize: 16 },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      border: "1px solid #eef2f7",
      background: "#f8fafc",
      cursor: "pointer",
      fontWeight: 1000,
    },
    modalBody: { padding: 16 },
    topGrid: { display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 14 },

    panel: { border: "1px solid #eef2f7", borderRadius: 16, padding: 14, background: "#fbfdff" },
    panelTitle: { fontSize: 12, fontWeight: 1000, color: "#64748b", marginBottom: 10, letterSpacing: 0.2 },
    kv: { display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "center" },
    k: { color: "#64748b", fontWeight: 900, fontSize: 13 },
    v: { color: "#0f172a", fontWeight: 1000, fontSize: 13 },

    stockPanel: { border: "1px solid #dcfce7", background: "#f3fbf5" },
    stockNumber: (tone) => ({ fontSize: 44, fontWeight: 1100, color: toneStyles(tone).fg, lineHeight: 1 }),
    stockMeta: { marginTop: 6, color: "#64748b", fontWeight: 900, fontSize: 13 },

    sectionTitle: { marginTop: 14, fontWeight: 1000, display: "flex", alignItems: "center", gap: 8 },
    subTableWrap: { marginTop: 10, border: "1px solid #eef2f7", borderRadius: 16, overflow: "hidden", background: "#fff" },
    subGrid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 },
  };

  function DetailModal() {
    if (!detailOpen) return null;

    const info = detailData?.info;
    const kondisi = detailData?.kondisi;

    const totalStok = toNumber(kondisi?.total_stok, 0);
    const minStok = toNumber(kondisi?.min_stok, 100);
    const lowStok = toNumber(kondisi?.low_stok, minStok * 2);
    const st = getStatusByMinLow(totalStok, minStok, lowStok);

    const batches = Array.isArray(detailData?.batches) ? detailData.batches : [];
    const purchases = Array.isArray(detailData?.purchases) ? detailData.purchases : [];
    const distributions = Array.isArray(detailData?.distributions) ? detailData.distributions : [];

    return (
      <div
        style={styles.overlay}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeDetail();
        }}
      >
        <div style={styles.modal}>
          <div style={styles.modalHead}>
            <div style={styles.modalTitle}>
              <span aria-hidden="true">💊</span>
              <span>{info?.nama_obat || "Detail Obat"}</span>
            </div>
            <button style={styles.closeBtn} onClick={closeDetail} aria-label="Tutup">
              ×
            </button>
          </div>

          <div style={styles.modalBody}>
            {detailLoading ? (
              <div style={styles.info}>Memuat detail...</div>
            ) : detailError ? (
              <div style={styles.info}>Gagal memuat detail: {detailError}</div>
            ) : !detailData ? (
              <div style={styles.info}>Tidak ada detail.</div>
            ) : (
              <>
                <div style={styles.topGrid}>
                  <div style={styles.panel}>
                    <div style={styles.panelTitle}>INFO OBAT</div>
                    <div style={styles.kv}>
                      <div style={styles.k}>Kode</div>
                      <div style={styles.v}>{info?.kode_obat || "-"}</div>

                      <div style={styles.k}>Kategori</div>
                      <div style={styles.v}>{info?.kategori || "-"}</div>

                      <div style={styles.k}>Satuan</div>
                      <div style={styles.v}>{info?.satuan || "-"}</div>

                      <div style={styles.k}>Harga</div>
                      <div style={styles.v}>Rp {formatNumberId(info?.harga || 0)}</div>
                    </div>
                  </div>

                  <div style={{ ...styles.panel, ...styles.stockPanel }}>
                    <div style={styles.panelTitle}>KONDISI STOK</div>
                    <div style={styles.stockNumber(st.tone)}>{formatNumberId(totalStok)}</div>
                    <div style={styles.stockMeta}>
                      {info?.satuan || "-"} tersedia · Min: {formatNumberId(minStok)}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <span style={styles.badge(st.tone)}>{st.label}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.sectionTitle}>
                  <span aria-hidden="true">📦</span>
                  <span>Batch Aktif ({batches.length})</span>
                </div>

                <div style={styles.subTableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>NO. BATCH</th>
                        <th style={styles.th}>TGL EXP</th>
                        <th style={styles.th}>SISA</th>
                        <th style={styles.th}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.length ? (
                        batches
                          .slice()
                          .sort((a, b) => new Date(a.exp_date) - new Date(b.exp_date))
                          .map((b, idx) => {
                            const badge = getBatchBadge(b.exp_date);
                            return (
                              <tr key={`${b.id_batch ?? "b"}-${idx}`}>
                                <td style={styles.td}>{b.batch || "-"}</td>
                                <td style={styles.td}>{formatDateId(b.exp_date)}</td>
                                <td style={styles.td}>{formatNumberId(b.sisa)}</td>
                                <td style={styles.td}>
                                  <span style={styles.badge(badge.tone)}>{badge.label}</span>
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td style={styles.td} colSpan={4}>
                            Tidak ada data batch
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={styles.subGrid2}>
                  <div>
                    <div style={styles.sectionTitle}>
                      <span aria-hidden="true">🧾</span>
                      <span>Riwayat Pembelian</span>
                    </div>
                    <div style={styles.subTableWrap}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>FAKTUR</th>
                            <th style={styles.th}>TGL</th>
                            <th style={styles.th}>JML</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchases.length ? (
                            purchases.map((p, idx) => (
                              <tr key={idx}>
                                <td style={styles.td}>{p.faktur || "-"}</td>
                                <td style={styles.td}>{formatDateId(p.tgl)}</td>
                                <td style={styles.td}>{formatNumberId(p.jml)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td style={styles.td} colSpan={3}>
                                Tidak ada data pembelian
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <div style={styles.sectionTitle}>
                      <span aria-hidden="true">🚚</span>
                      <span>Riwayat Distribusi</span>
                    </div>
                    <div style={styles.subTableWrap}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>TUJUAN</th>
                            <th style={styles.th}>TGL</th>
                            <th style={styles.th}>JML</th>
                          </tr>
                        </thead>
                        <tbody>
                          {distributions.length ? (
                            distributions.map((d, idx) => (
                              <tr key={idx}>
                                <td style={styles.td}>{d.tujuan || "-"}</td>
                                <td style={styles.td}>{formatDateId(d.tgl)}</td>
                                <td style={styles.td}>{formatNumberId(d.jml)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td style={styles.td} colSpan={3}>
                                Tidak ada data distribusi
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <h1 style={styles.title}>Monitor Stok</h1>
        <div style={styles.subtitle}>Pantau ketersediaan dan kondisi stok obat secara real-time</div>

        {/* ===== CARDS (lebih kecil) ===== */}
        <div style={styles.cards}>
          <div style={styles.card}>
            <div style={styles.cardTopLine("#22c55e")} />
            <div style={styles.cardIcon("#e9fceF")}>📦</div>
            <div style={styles.cardLabel}>TOTAL ITEM</div>
            <div style={{ ...styles.cardValue, color: "#15803d" }}>{formatNumberId(summary.totalItem)}</div>
            <div style={styles.cardHint}>Jenis obat</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTopLine("#ef4444")} />
            <div style={styles.cardIcon("#ffecee")}>🚨</div>
            <div style={styles.cardLabel}>STOK KRITIS</div>
            <div style={{ ...styles.cardValue, color: "#ef4444" }}>{formatNumberId(summary.kritis)}</div>
            <div style={styles.cardHint}>Di bawah minimum</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTopLine("#f59e0b")} />
            <div style={styles.cardIcon("#fff6e6")}>⚡</div>
            <div style={styles.cardLabel}>STOK RENDAH</div>
            <div style={{ ...styles.cardValue, color: "#d97706" }}>{formatNumberId(summary.rendah)}</div>
            <div style={styles.cardHint}>Perlu diperhatikan</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTopLine("#2563eb")} />
            <div style={styles.cardIcon("#eaf2ff")}>🧮</div>
            <div style={{ ...styles.cardLabel, color: "#2563eb" }}>TOTAL STOK</div>
            <div style={{ ...styles.cardValue, color: "#2563eb" }}>{formatNumberId(summary.totalStok)}</div>
            <div style={styles.cardHint}>Unit tersedia</div>
          </div>
        </div>

        {(loading || error) && <div style={styles.info}>{loading ? "Memuat data..." : `Gagal memuat: ${error}`}</div>}

        <div style={styles.filters}>
          <input style={styles.input} placeholder="Cari nama obat..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={styles.input} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="Semua">Semua Status</option>
            <option value="Normal">Normal</option>
            <option value="Rendah">Rendah</option>
            <option value="Kritis">Kritis</option>
          </select>
          <select style={styles.input} value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
            {kategoriOptions.map((k) => (
              <option key={k} value={k}>
                {k === "Semua" ? "Semua Kategori" : k}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>KODE</th>
                <th style={styles.th}>NAMA OBAT</th>
                <th style={styles.th}>KATEGORI</th>
                <th style={styles.th}>STOK</th>
                <th style={styles.th}>MIN</th>
                <th style={styles.th}>SATUAN</th>
                <th style={styles.th}>PROGRESS</th>
                <th style={styles.th}>STATUS</th>
                <th style={styles.th}>EXPIRED</th>
                <th style={styles.th}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length ? (
                filteredItems.map((item) => (
                  <tr key={item.key}>
                    <td style={{ ...styles.td, ...styles.code }}>{item.kode_obat}</td>
                    <td style={styles.td}><div style={styles.name}>{item.nama_obat}</div></td>
                    <td style={styles.td}><span style={styles.catPill}>{item.kategori}</span></td>
                    <td style={{ ...styles.td, fontWeight: 1000 }}>{formatNumberId(item.total_stok)}</td>
                    <td style={styles.td}>{formatNumberId(item.min_stok)}</td>
                    <td style={styles.td}>{item.satuan}</td>
                    <td style={styles.td}>
                      <div style={styles.progressTrack}><div style={styles.progressBar(item.status.tone, item.progress)} /></div>
                      <div style={styles.progressText}>{Math.round(item.progress)}%</div>
                    </td>
                    <td style={styles.td}><span style={styles.badge(item.status.tone)}>{item.status.label}</span></td>
                    <td style={styles.td}>{formatDateId(item.exp_terdekat)}</td>
                    <td style={styles.td}>
                      <button style={styles.btn} onClick={() => openDetail(item)}>Detail</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td style={styles.td} colSpan={10}>Tidak ada data stok</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailModal />
    </div>
  );
}