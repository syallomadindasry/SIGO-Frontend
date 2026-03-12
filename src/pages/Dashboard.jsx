import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  AlertTriangle,
  AlarmClock,
  Building2,
  TrendingUp,
} from "lucide-react";
import { getDashboardSummary, getDistribusiBulanan } from "../services/api.js";

function isExpiringSoon(exp) {
  const d = (new Date(exp) - new Date()) / 86400000;
  return d < 30 && d > 0;
}

function isExpired(exp) {
  return new Date(exp) < new Date();
}

function getStockStatus(stok) {
  const n = Number(stok || 0);
  if (n < 100) return { label: "Kritis", color: "#ef4444", bg: "#fde7ea" };
  if (n < 200) {
    return { label: "Hampir habis", color: "#eab308", bg: "#fef3c7" };
  }
  return { label: "Aman", color: "#15803d", bg: "#e7f3ea" };
}

function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID");
}

export default function Dashboard({ user, stokData = [], onNavigate }) {
  const [monthRange, setMonthRange] = useState(6);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [summary, setSummary] = useState({
    total_item_obat: 0,
    total_stok: 0,
    jumlah_stok_kritis: 0,
    jumlah_segera_expired: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(false);

  const myStok = useMemo(() => {
    if (!user) return [];

    const isDinkes =
      user.role === "dinkes" || user?.warehouse?.type === "DINKES";

    if (isDinkes) return stokData;

    return stokData.filter(
      (s) => String(s.id_gudang) === String(user.id_gudang)
    );
  }, [stokData, user]);

  const groupedByObat = useMemo(() => {
    const map = new Map();

    myStok.forEach((item) => {
      const key = item.id_obat || item.nama_obat;

      if (!map.has(key)) {
        map.set(key, {
          id_obat: item.id_obat,
          nama_obat: item.nama_obat,
          total_stok: 0,
          exp_date: item.exp_date,
          batch: item.batch,
        });
      }

      const current = map.get(key);
      current.total_stok += Number(item.stok || 0);

      if (
        item.exp_date &&
        (!current.exp_date ||
          new Date(item.exp_date) < new Date(current.exp_date))
      ) {
        current.exp_date = item.exp_date;
        current.batch = item.batch;
      }
    });

    return Array.from(map.values());
  }, [myStok]);

  const stokKritis = groupedByObat
    .filter((item) => Number(item.total_stok) < 100)
    .sort((a, b) => Number(a.total_stok) - Number(b.total_stok))
    .slice(0, 5);

  const stokHampirHabis = groupedByObat
    .filter(
      (item) => Number(item.total_stok) >= 100 && Number(item.total_stok) < 200
    )
    .sort((a, b) => Number(b.total_stok) - Number(a.total_stok))
    .slice(0, 5);

  const segeraExpired = myStok
    .filter((item) => isExpiringSoon(item.exp_date) || isExpired(item.exp_date))
    .sort((a, b) => new Date(a.exp_date) - new Date(b.exp_date))
    .slice(0, 5);

  const topDistribusi = [...groupedByObat]
    .sort((a, b) => Number(b.total_stok) - Number(a.total_stok))
    .slice(0, 5);

  useEffect(() => {
    if (!user) return;

    const isDinkes =
      user.role === "dinkes" || user?.warehouse?.type === "DINKES";

    setSummaryLoading(true);

    getDashboardSummary(user?.id_gudang || 0, isDinkes ? "dinkes" : "puskesmas")
      .then((result) => {
        setSummary(
          result.data || {
            total_item_obat: 0,
            total_stok: 0,
            jumlah_stok_kritis: 0,
            jumlah_segera_expired: 0,
          }
        );
      })
      .catch((err) => {
        console.error("Gagal ambil summary dashboard:", err);
      })
      .finally(() => setSummaryLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const isDinkes =
      user.role === "dinkes" || user?.warehouse?.type === "DINKES";

    setChartLoading(true);

    getDistribusiBulanan(
      monthRange,
      user?.id_gudang || 0,
      isDinkes ? "dinkes" : "puskesmas"
    )
      .then((result) => {
        setChartData(Array.isArray(result.data) ? result.data : []);
      })
      .catch((err) => {
        console.error("Gagal ambil chart distribusi:", err);
        setChartData([]);
      })
      .finally(() => {
        setChartLoading(false);
      });
  }, [user, monthRange]);

  const hasChartValue = chartData.some((item) => Number(item.total || 0) > 0);

  const maxChartValue = useMemo(() => {
    const max = Math.max(...chartData.map((i) => Number(i.total || 0)), 0);
    if (max <= 0) return 100;
    if (max < 100) return 100;
    return Math.ceil(max / 50) * 50;
  }, [chartData]);

  const highlightedIndex = chartData.findIndex(
    (i) => i.total === Math.max(...chartData.map((x) => x.total), 0)
  );

  const chartTicks = useMemo(() => {
    return [
      maxChartValue,
      Math.round(maxChartValue * 0.75),
      Math.round(maxChartValue * 0.5),
      Math.round(maxChartValue * 0.25),
      0,
    ];
  }, [maxChartValue]);

  const cards = [
    {
      title: "TOTAL ITEM OBAT",
      value: summaryLoading ? "..." : Number(summary.total_item_obat || 0),
      note: "Jenis obat terdaftar",
      badge: "↗ Aktif",
      color: "#17803d",
      topColor: "#37c07a",
      iconBg: "#e9f7ef",
      iconColor: "#b07a43",
      badgeBg: "#e7f3ea",
      badgeColor: "#176b45",
      icon: <Package size={16} />,
    },
    {
      title: "STOK KRITIS",
      value: summaryLoading ? "..." : Number(summary.jumlah_stok_kritis || 0),
      note: "Di bawah batas minimum",
      badge: Number(summary.jumlah_stok_kritis || 0) > 0 ? "Kritis" : "✓ Aman",
      color: "#ef4444",
      topColor: "#ff4d4f",
      iconBg: "#fdecec",
      iconColor: "#ef4444",
      badgeBg:
        Number(summary.jumlah_stok_kritis || 0) > 0 ? "#fde7ea" : "#e7f3ea",
      badgeColor:
        Number(summary.jumlah_stok_kritis || 0) > 0 ? "#b42335" : "#176b45",
      icon: <AlertTriangle size={16} />,
    },
    {
      title: "SEGERA EXPIRED",
      value: summaryLoading
        ? "..."
        : Number(summary.jumlah_segera_expired || 0),
      note: "Dalam 30 hari ke depan",
      badge:
        Number(summary.jumlah_segera_expired || 0) > 0
          ? "Perhatikan"
          : "✓ Aman",
      color: "#d97706",
      topColor: "#f59e0b",
      iconBg: "#fff4d8",
      iconColor: "#f59e0b",
      badgeBg:
        Number(summary.jumlah_segera_expired || 0) > 0 ? "#fde7b3" : "#e7f3ea",
      badgeColor:
        Number(summary.jumlah_segera_expired || 0) > 0 ? "#cc7a00" : "#176b45",
      icon: <AlarmClock size={16} />,
    },
    {
      title: "TOTAL STOK",
      value: summaryLoading
        ? "..."
        : Number(summary.total_stok || 0).toLocaleString("id-ID"),
      note: "Unit tersedia seluruhnya",
      badge: "↑ +5.2%",
      color: "#2563eb",
      topColor: "#3b82f6",
      iconBg: "#e8f0fe",
      iconColor: "#2563eb",
      badgeBg: "#e7f3ea",
      badgeColor: "#176b45",
      icon: <Building2 size={16} />,
    },
  ];

  const actionButton = {
    textAlign: "right",
    marginTop: 14,
    color: "#2563eb",
    fontWeight: 700,
    cursor: "pointer",
    display: "block",
    background: "transparent",
    border: "none",
    padding: 0,
    marginLeft: "auto",
    fontSize: 16,
  };

  const topCardStyle = {
    background: "#fff",
    border: "1px solid #dfe7ef",
    borderRadius: 16,
    padding: "14px 16px 14px",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.04)",
    position: "relative",
    overflow: "hidden",
    minHeight: 125,
  };

  const sectionCard = {
    background: "#fff",
    border: "1px solid #e3e7ef",
    borderRadius: 20,
    padding: 16,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  };

  const tableBox = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 15,
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
  };

  const getAdaptiveCardStyle = (count = 0, options = {}) => {
    const {
      normalMinHeight = 320,
      smallMinHeight = 170,
      emptyMinHeight = 150,
    } = options;

    let minHeight = normalMinHeight;

    if (count === 0) {
      minHeight = emptyMinHeight;
    } else if (count < 5) {
      minHeight = smallMinHeight;
    }

    return {
      ...sectionCard,
      minHeight,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {cards.map((item, i) => (
          <div key={i} style={topCardStyle}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3.5,
                background: item.topColor,
              }}
            />

            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: item.iconBg,
                color: item.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              {React.cloneElement(item.icon, { size: 14 })}
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#667085",
                marginBottom: 6,
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                fontSize: 24,
                lineHeight: 1,
                fontWeight: 800,
                color: item.color,
                marginBottom: 8,
              }}
            >
              {item.value}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  color: "#7b8a9d",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {item.note}
              </div>

              <span
                style={{
                  background: item.badgeBg,
                  color: item.badgeColor,
                  borderRadius: 999,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {item.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 0.9fr",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ ...sectionCard, padding: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#26324d",
                }}
              >
                Distribusi Obat Bulanan
              </div>

              <select
                value={monthRange}
                onChange={(e) => setMonthRange(Number(e.target.value))}
                style={{
                  width: 160,
                  border: "1px solid #d7deea",
                  background: "#fff",
                  color: "#44516b",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value={3}>3 bulan terakhir</option>
                <option value={6}>6 bulan terakhir</option>
                <option value={12}>12 bulan terakhir</option>
              </select>
            </div>

            <div
              style={{
                position: "relative",
                borderTop: "1px solid #eef2f7",
                paddingTop: 12,
                paddingLeft: 42,
                paddingRight: 10,
                paddingBottom: 8,
              }}
            >
              <div style={{ position: "relative", height: 150 }}>
                {chartTicks.map((tick, index) => {
                  const bottom = (index / (chartTicks.length - 1)) * 100;
                  return (
                    <React.Fragment key={tick}>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: `${100 - bottom}%`,
                          borderTop: "1px solid #edf1f6",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: -42,
                          width: 34,
                          textAlign: "right",
                          bottom: `calc(${100 - bottom}% - 8px)`,
                          fontSize: 11,
                          color: "#7a869a",
                          fontWeight: 600,
                        }}
                      >
                        {tick.toLocaleString("id-ID")}
                      </div>
                    </React.Fragment>
                  );
                })}

                {chartLoading ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Loading chart...
                  </div>
                ) : !hasChartValue ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94a3b8",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Belum ada data distribusi
                  </div>
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      gridTemplateColumns: `repeat(${Math.max(
                        chartData.length,
                        6
                      )}, 1fr)`,
                      alignItems: "end",
                      gap: 12,
                    }}
                  >
                    {chartData.map((item, idx) => {
                      const rawHeight =
                        (Number(item.total || 0) / maxChartValue) * 118;
                      const height =
                        item.total > 0 ? Math.max(rawHeight, 18) : 0;
                      const isHighlight =
                        idx === highlightedIndex && item.total > 0;

                      return (
                        <div
                          key={`${item.bulan}-${idx}`}
                          style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "end",
                            height: "100%",
                          }}
                        >
                          {isHighlight && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: height + 30,
                                left: "50%",
                                transform: "translateX(-50%)",
                                background: "#475166",
                                color: "#fff",
                                padding: "7px 12px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                              }}
                            >
                              {item.total.toLocaleString("id-ID")} Unit
                              <div
                                style={{
                                  position: "absolute",
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  bottom: -7,
                                  width: 0,
                                  height: 0,
                                  borderLeft: "7px solid transparent",
                                  borderRight: "7px solid transparent",
                                  borderTop: "7px solid #475166",
                                }}
                              />
                            </div>
                          )}

                          {item.total > 0 ? (
                            <div
                              style={{
                                width: "62%",
                                minWidth: 22,
                                height,
                                borderRadius: 4,
                                background:
                                  idx <= 2
                                    ? "linear-gradient(180deg, #f4c63a 0%, #efc232 100%)"
                                    : "linear-gradient(180deg, #b5ca69 0%, #6eb18f 100%)",
                                boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "62%",
                                minWidth: 22,
                                height: 0,
                              }}
                            />
                          )}

                          <div
                            style={{
                              marginTop: 10,
                              fontSize: 12,
                              color: "#64748b",
                              fontWeight: 600,
                            }}
                          >
                            {item.bulan}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "#55627a",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: "#efc232",
                    display: "inline-block",
                  }}
                />
                Total Obat Didistribusikan
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 18,
              alignItems: "start",
            }}
          >
            <div
              style={getAdaptiveCardStyle(stokKritis.length, {
                normalMinHeight: 320,
                smallMinHeight: 210,
                emptyMinHeight: 150,
              })}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#26324d",
                    marginBottom: 16,
                  }}
                >
                  STOK KRITIS
                </div>

                <div
                  style={{
                    border: "1px solid #eceff5",
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  <table style={tableBox}>
                    <tbody>
                      {stokKritis.length > 0 ? (
                        stokKritis.map((item, i) => {
                          const status = getStockStatus(item.total_stok);
                          return (
                            <tr key={i}>
                              <td style={{ ...tdStyle, fontWeight: 600 }}>
                                {item.nama_obat}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  width: 100,
                                  textAlign: "right",
                                  color: status.color,
                                  fontWeight: 800,
                                }}
                              >
                                {item.total_stok}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            style={{
                              ...tdStyle,
                              borderBottom: "none",
                            }}
                            colSpan={2}
                          >
                            Tidak ada stok kritis
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                type="button"
                style={actionButton}
                onClick={() => onNavigate("stok")}
              >
                Lihat Semua →
              </button>
            </div>

            <div
              style={getAdaptiveCardStyle(segeraExpired.length, {
                normalMinHeight: 320,
                smallMinHeight: 230,
                emptyMinHeight: 170,
              })}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#26324d",
                    marginBottom: 16,
                  }}
                >
                  OBAT SEGERA EXPIRED
                </div>

                <div
                  style={{
                    border: "1px solid #eceff5",
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  <table style={tableBox}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Nama Obat</th>
                        <th style={thStyle}>Expired</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segeraExpired.length > 0 ? (
                        segeraExpired.map((item, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{item.nama_obat}</td>
                            <td style={tdStyle}>{formatDate(item.exp_date)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td style={tdStyle} colSpan={2}>
                            Tidak ada obat segera expired
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                type="button"
                style={actionButton}
                onClick={() => onNavigate("stok")}
              >
                Lihat Semua →
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div
            style={getAdaptiveCardStyle(
              [...stokKritis, ...stokHampirHabis].slice(0, 5).length,
              {
                normalMinHeight: 320,
                smallMinHeight: 180,
                emptyMinHeight: 160,
              }
            )}
          >
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#26324d",
                  marginBottom: 16,
                }}
              >
                STATUS STOK
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {[...stokKritis, ...stokHampirHabis]
                  .slice(0, 5)
                  .map((item, i) => {
                    const status = getStockStatus(item.total_stok);
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 14px",
                          border: "1px solid #eef2f7",
                          borderRadius: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#2c3650",
                            }}
                          >
                            {item.nama_obat}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "#7b8a83",
                            }}
                          >
                            Stok: {item.total_stok}
                          </div>
                        </div>
                        <span
                          style={{
                            background: status.bg,
                            color: status.color,
                            borderRadius: 999,
                            padding: "6px 12px",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {status.label}
                        </span>
                      </div>
                    );
                  })}

                {stokKritis.length === 0 && stokHampirHabis.length === 0 && (
                  <div
                    style={{
                      padding: "14px",
                      border: "1px solid #eef2f7",
                      borderRadius: 12,
                      color: "#7b8a83",
                    }}
                  >
                    Semua stok aman
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              style={actionButton}
              onClick={() => onNavigate("stok")}
            >
              Lihat Semua →
            </button>
          </div>

          <div
            style={getAdaptiveCardStyle(topDistribusi.length, {
              normalMinHeight: 320,
              smallMinHeight: 220,
              emptyMinHeight: 170,
            })}
          >
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#26324d",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <TrendingUp size={18} />
                Top 5 Obat
              </div>

              <div
                style={{
                  border: "1px solid #eceff5",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <table style={tableBox}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Nama Obat</th>
                      <th style={thStyle}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDistribusi.length > 0 ? (
                      topDistribusi.map((item, i) => (
                        <tr key={i}>
                          <td style={tdStyle}>{item.nama_obat}</td>
                          <td
                            style={{
                              ...tdStyle,
                              textAlign: "right",
                              fontWeight: 700,
                              color: "#2563eb",
                            }}
                          >
                            {item.total_stok}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={tdStyle} colSpan={2}>
                          Belum ada data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              type="button"
              style={actionButton}
              onClick={() => onNavigate("laporan")}
            >
              Lihat Semua →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}