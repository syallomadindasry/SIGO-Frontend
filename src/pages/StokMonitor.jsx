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
  const min = Math.max(0, toNumber(minStok, 0));
  const low = Math.max(min, toNumber(lowStok, min > 0 ? min * 2 : 0));

  if (min > 0 && s < min) return { label: "Kritis", tone: "danger" };
  if (low > 0 && s < low) return { label: "Rendah", tone: "warning" };
  return { label: "Normal", tone: "success" };
}

function getProgressPercent(stok, minStok) {
  const s = Math.max(0, toNumber(stok, 0));
  const m = Math.max(0, toNumber(minStok, 0));
  if (m <= 0) return 100;
  const denom = m * 4; // stok == min -> 25%
  return Math.max(0, Math.min(100, (s / denom) * 100));
}

/**
 * rows dari API:
 * { id_gudang,id_batch,stok,batch,exp_date,id_obat,nama_obat,satuan,jenis,min_stok,low_stok,nama_gudang }
 */
function groupRowsByObat(rows) {
  const map = new Map();

  for (const r of rows) {
    const idObat = String(r.id_obat ?? "");
    if (!idObat) continue;

    if (!map.has(idObat)) {
      map.set(idObat, {
        key: idObat,
        id_obat: r.id_obat,
        nama_obat: r.nama_obat ?? "-",
        kategori: r.jenis ?? "-",
        satuan: r.satuan ?? "-",
        min_stok: toNumber(r.min_stok, 0),
        low_stok: toNumber(r.low_stok, 0),
        total_stok: 0,
        exp_terdekat: r.exp_date ?? null,
        batches: [],
      });
    }

    const cur = map.get(idObat);
    cur.total_stok += toNumber(r.stok, 0);

    // keep thresholds (in case different rows have same obat)
    if (toNumber(r.min_stok, 0) > 0) cur.min_stok = toNumber(r.min_stok, cur.min_stok);
    if (toNumber(r.low_stok, 0) > 0) cur.low_stok = toNumber(r.low_stok, cur.low_stok);

    if (r.exp_date) {
      if (!cur.exp_terdekat) cur.exp_terdekat = r.exp_date;
      else {
        const a = new Date(r.exp_date);
        const b = new Date(cur.exp_terdekat);
        if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) && a < b) {
          cur.exp_terdekat = r.exp_date;
        }
      }
    }

    cur.batches.push({
      id_batch: r.id_batch,
      batch: r.batch,
      exp_date: r.exp_date,
      sisa: r.stok,
      nama_gudang: r.nama_gudang,
      id_gudang: r.id_gudang,
    });
  }

  return Array.from(map.values());
}

export default function StokMonitor({ user, apiUrl = "/api/stok_batch.php" }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const isDinkes = user?.role === "dinkes" || user?.warehouse?.type === "DINKES";
        const idGudang = isDinkes ? 0 : toNumber(user?.id_gudang, 0);
        const url = idGudang ? `${apiUrl}?id_gudang=${encodeURIComponent(idGudang)}` : apiUrl;

        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
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
  }, [apiUrl, user]);

  const grouped = useMemo(() => {
    const items = groupRowsByObat(rows).map((it) => {
      const status = getStatusByMinLow(it.total_stok, it.min_stok, it.low_stok);
      const progress = getProgressPercent(it.total_stok, it.min_stok);
      return { ...it, status, progress };
    });

    const prio = { Kritis: 0, Rendah: 1, Normal: 2 };
    return items.sort((a, b) => {
      const pa = prio[a.status.label] ?? 9;
      const pb = prio[b.status.label] ?? 9;
      if (pa !== pb) return pa - pb;
      return String(a.nama_obat).localeCompare(String(b.nama_obat), "id-ID");
    });
  }, [rows]);

  const kategoriOptions = useMemo(() => {
    const set = new Set(grouped.map((g) => g.kategori).filter((k) => k && k !== "-"));
    return ["Semua", ...Array.from(set).sort((a, b) => a.localeCompare(b, "id-ID"))];
  }, [grouped]);

  const filteredItems = useMemo(() => {
    const q = safeLower(search);

    return grouped.filter((item) => {
      const matchSearch =
        !q ||
        safeLower(item.nama_obat).includes(q) ||
        safeLower(item.kategori).includes(q) ||
        safeLower(item.key).includes(q);

      const matchStatus = filterStatus === "Semua" ? true : item.status.label === filterStatus;
      const matchKategori = filterKategori === "Semua" ? true : item.kategori === filterKategori;

      return matchSearch && matchStatus && matchKategori;
    });
  }, [grouped, search, filterStatus, filterKategori]);

  const summary = useMemo(() => {
    const totalItem = filteredItems.length;
    const totalStok = filteredItems.reduce((acc, it) => acc + toNumber(it.total_stok, 0), 0);
    const kritis = filteredItems.filter((it) => it.status.label === "Kritis").length;
    const rendah = filteredItems.filter((it) => it.status.label === "Rendah").length;
    return { totalItem, totalStok, kritis, rendah };
  }, [filteredItems]);

  const styles = {
    page: {
      padding: 24,
      background: "#f3f6fb",
      minHeight: "100vh",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
      color: "#0f172a",
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
    header: { marginBottom: 18 },
    title: { fontSize: 28, fontWeight: 800, margin: 0 },
    subtitle: { marginTop: 6, color: "#64748b", fontSize: 14 },

    cards: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: 14,
      marginTop: 16,
    },
    card: {
      background: "#fff",
      border: "1px solid #e8edf6",
      borderRadius: 16,
      padding: 16,
      boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
      position: "relative",
      overflow: "hidden",
    },
    cardTopLine: (c) => ({ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c }),
    cardIcon: (bg) => ({
      width: 40,
      height: 40,
      borderRadius: 12,
      display: "grid",
      placeItems: "center",
      background: bg,
      marginBottom: 10,
      border: "1px solid #eef2f7",
    }),
    cardLabel: { fontSize: 12, fontWeight: 800, color: "#64748b", letterSpacing: 0.2 },
    cardValue: { fontSize: 30, fontWeight: 900, marginTop: 6, lineHeight: 1.1 },
    cardHint: { marginTop: 6, fontSize: 12, color: "#94a3b8" },

    info: { marginTop: 10, color: "#64748b", fontWeight: 700, fontSize: 13 },

    filters: { display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginTop: 14, marginBottom: 14 },
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
      fontWeight: 900,
      borderBottom: "1px solid #e6ebf2",
      fontSize: 12,
      letterSpacing: 0.2,
    },
    td: { padding: "12px 14px", borderBottom: "1px solid #eef2f7", verticalAlign: "middle", color: "#1f2937" },
    code: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", color: "#64748b" },
    name: { fontWeight: 800, color: "#0f172a" },

    catPill: {
      display: "inline-block",
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
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
        fontWeight: 900,
        color: t.fg,
        background: t.bg,
        border: `1px solid ${t.border}`,
        whiteSpace: "nowrap",
      };
    },
    progressTrack: {
      height: 8,
      background: "#eef2f7",
      borderRadius: 999,
      overflow: "hidden",
      width: 140,
      border: "1px solid #e9eef7",
    },
    progressBar: (tone, pct) => {
      const t = toneStyles(tone);
      return { height: "100%", width: `${pct}%`, background: t.fg, borderRadius: 999 };
    },
    progressText: { marginTop: 6, fontSize: 12, color: "#94a3b8", fontWeight: 800 },

    btn: {
      border: "none",
      borderRadius: 10,
      padding: "8px 12px",
      fontWeight: 900,
      fontSize: 13,
      cursor: "pointer",
      background: "#15803d",
      color: "#fff",
      boxShadow: "0 10px 18px rgba(21, 128, 61, 0.18)",
    },

    // modal
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
      width: "min(920px, 100%)",
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
    modalTitle: { display: "flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 16 },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      border: "1px solid #eef2f7",
      background: "#f8fafc",
      cursor: "pointer",
      fontWeight: 900,
    },
    modalBody: { padding: 16 },
    grid2: { display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 14 },
    panel: { border: "1px solid #eef2f7", borderRadius: 16, padding: 14, background: "#fbfdff" },
    panelTitle: { fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 10, letterSpacing: 0.2 },
    kv: { display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "center" },
    k: { color: "#64748b", fontWeight: 800, fontSize: 13 },
    v: { color: "#0f172a", fontWeight: 900, fontSize: 13 },
    subTableWrap: { border: "1px solid #eef2f7", borderRadius: 16, overflow: "hidden", background: "#fff" },
    empty: { padding: 16, color: "#64748b", fontWeight: 700 },
  };

  function Modal({ item, onClose }) {
    if (!item) return null;
    const st = item.status;
    const t = toneStyles(st.tone);

    return (
      <div
        style={styles.overlay}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div style={styles.modal}>
          <div style={styles.modalHead}>
            <div style={styles.modalTitle}>
              <span aria-hidden="true">💊</span>
              <span>{item.nama_obat}</span>
            </div>
            <button style={styles.closeBtn} onClick={onClose} aria-label="Tutup">
              ×
            </button>
          </div>

          <div style={styles.modalBody}>
            <div style={styles.grid2}>
              <div style={styles.panel}>
                <div style={styles.panelTitle}>INFO OBAT</div>
                <div style={styles.kv}>
                  <div style={styles.k}>ID Obat</div>
                  <div style={styles.v}>{item.id_obat}</div>

                  <div style={styles.k}>Kategori</div>
                  <div style={styles.v}>{item.kategori}</div>

                  <div style={styles.k}>Satuan</div>
                  <div style={styles.v}>{item.satuan}</div>

                  <div style={styles.k}>Min / Low</div>
                  <div style={styles.v}>
                    {formatNumberId(item.min_stok)} / {formatNumberId(item.low_stok || item.min_stok * 2)}
                  </div>
                </div>
              </div>

              <div style={{ ...styles.panel, background: "#f3fbf5", borderColor: "#dcfce7" }}>
                <div style={styles.panelTitle}>KONDISI STOK</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <div style={{ fontSize: 40, fontWeight: 1000, color: t.fg, lineHeight: 1 }}>
                    {formatNumberId(item.total_stok)}
                  </div>
                </div>
                <div style={{ marginTop: 6, color: "#64748b", fontWeight: 800, fontSize: 13 }}>
                  {item.satuan} tersedia · Exp terdekat: {formatDateId(item.exp_terdekat)}
                </div>
                <div style={{ marginTop: 10 }}>
                  <span style={styles.badge(st.tone)}>{st.label}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, fontWeight: 1000, display: "flex", alignItems: "center", gap: 8 }}>
              <span aria-hidden="true">📦</span>
              <span>Batch ({item.batches.length})</span>
            </div>

            <div style={{ marginTop: 10, ...styles.subTableWrap }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>NO. BATCH</th>
                    <th style={styles.th}>TGL EXP</th>
                    <th style={styles.th}>SISA</th>
                    <th style={styles.th}>GUDANG</th>
                  </tr>
                </thead>
                <tbody>
                  {item.batches.length ? (
                    item.batches
                      .slice()
                      .sort((a, b) => new Date(a.exp_date) - new Date(b.exp_date))
                      .map((b, idx) => (
                        <tr key={`${b.id_batch}-${idx}`}>
                          <td style={styles.td}>{b.batch ?? "-"}</td>
                          <td style={styles.td}>{formatDateId(b.exp_date)}</td>
                          <td style={styles.td}>{formatNumberId(b.sisa)}</td>
                          <td style={styles.td}>{b.nama_gudang ?? "-"}</td>
                        </tr>
                      ))
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

            <div style={{ marginTop: 12, color: "#94a3b8", fontWeight: 800, fontSize: 12 }}>
              Status: Kritis (&lt; min), Rendah (&lt; low), Normal.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <h1 style={styles.title}>Monitor Stok</h1>
          <div style={styles.subtitle}>Pantau ketersediaan dan kondisi stok obat secara real-time</div>

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

          {(loading || error) && (
            <div style={styles.info}>
              {loading ? "Memuat data..." : null}
              {error ? `Gagal memuat: ${error}` : null}
            </div>
          )}
        </div>

        <div style={styles.filters}>
          <input
            type="text"
            placeholder="Cari nama obat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.input}>
            <option value="Semua">Semua Status</option>
            <option value="Normal">Normal</option>
            <option value="Rendah">Rendah</option>
            <option value="Kritis">Kritis</option>
          </select>

          <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} style={styles.input}>
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
                filteredItems.map((item) => {
                  const st = item.status;
                  return (
                    <tr key={item.key}>
                      <td style={{ ...styles.td, ...styles.code }}>{`OBT-${String(item.key).padStart(3, "0")}`}</td>

                      <td style={styles.td}>
                        <div style={styles.name}>{item.nama_obat}</div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.catPill}>{item.kategori}</span>
                      </td>

                      <td style={{ ...styles.td, fontWeight: 1000 }}>{formatNumberId(item.total_stok)}</td>
                      <td style={styles.td}>{formatNumberId(item.min_stok)}</td>
                      <td style={styles.td}>{item.satuan}</td>

                      <td style={styles.td}>
                        <div style={styles.progressTrack} aria-label={`Progress ${Math.round(item.progress)}%`}>
                          <div style={styles.progressBar(st.tone, item.progress)} />
                        </div>
                        <div style={styles.progressText}>{Math.round(item.progress)}%</div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.badge(st.tone)}>{st.label}</span>
                      </td>

                      <td style={styles.td}>{formatDateId(item.exp_terdekat)}</td>

                      <td style={styles.td}>
                        <button style={styles.btn} onClick={() => setSelected(item)}>
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td style={styles.empty} colSpan={10}>
                    Tidak ada data stok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}