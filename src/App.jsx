import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as api from "./services/api.js";
import { globalStyles } from "./styles/globalStyles.js";

import LoginPage from "./components/LoginPage.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import StokMonitor from "./pages/StokMonitor.jsx";
import MasterObat from "./pages/MasterObat.jsx";
import MasterBatch from "./pages/MasterBatch.jsx";
import Pembelian from "./pages/Pembelian.jsx";
import Laporan from "./pages/Laporan.jsx";
import Distribusi from "./pages/Distribusi.jsx";
import Pemakaian from "./pages/Pemakaian.jsx";
import Retur from "./pages/Retur.jsx";
import Penghapusan from "./pages/Penghapusan.jsx";

function normalizeUser(raw) {
  if (!raw) return null;

  const wh = raw.warehouse || raw.gudang || {};
  const gudangId = Number(wh.code || raw.id_gudang || raw.id_gudang_user || 0);

  const type = String(wh.type || raw.role || "").toUpperCase();
  const role = type === "DINKES" ? "dinkes" : "puskesmas";

  return {
    ...raw,
    id_admin: Number(raw.id_admin || raw.id || raw.sub || 0),
    id_gudang: gudangId,
    nama: raw.nama || raw.displayName || raw.username || "User",
    role,
    warehouse: {
      code: String(wh.code || gudangId || ""),
      name: wh.name || raw.nama_gudang || "",
      type: type || (role === "dinkes" ? "DINKES" : "PUSKESMAS"),
    },
  };
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  const [gudangList, setGudangList] = useState([]);
  const [stokData, setStokData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("sigo_token");
    const saved = localStorage.getItem("sigo_user");
    if (!token) return;

    api
      .me()
      .then((r) => {
        if (saved) setUser(normalizeUser(JSON.parse(saved)));
        else if (r?.user) setUser(normalizeUser(r.user));
      })
      .catch(() => {
        localStorage.removeItem("sigo_token");
        localStorage.removeItem("sigo_user");
      });
  }, []);

  const reloadStok = useCallback(async () => {
    const data = await api.getStok(0);
    setStokData(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (!user) return;
    api.getGudang().then((g) => setGudangList(Array.isArray(g) ? g : []));
    reloadStok();
  }, [user, reloadStok]);

  function handleLogout() {
    localStorage.removeItem("sigo_token");
    localStorage.removeItem("sigo_user");
    setUser(null);
    setActivePage("dashboard");
    setStokData([]);
  }

  const navDinkes = useMemo(
    () => [
      {
        section: "Utama",
        items: [
          { id: "dashboard", icon: "🏠", label: "Dashboard" },
          { id: "stok", icon: "📦", label: "Monitor Stok" },
        ],
      },
      {
        section: "Master Data",
        items: [
          { id: "master-obat", icon: "💊", label: "Master Obat" },
          { id: "master-batch", icon: "🏷️", label: "Master Batch" },
        ],
      },
      {
        section: "Transaksi",
        items: [
          { id: "pembelian", icon: "🛒", label: "Pembelian" },
          { id: "distribusi", icon: "🚚", label: "Distribusi" },
          { id: "penghapusan", icon: "🗑️", label: "Penghapusan" },
        ],
      },
      {
        section: "Laporan",
        items: [{ id: "laporan", icon: "📊", label: "Laporan" }],
      },
    ],
    []
  );

  const navPuskesmas = useMemo(
    () => [
      {
        section: "Utama",
        items: [
          { id: "dashboard", icon: "🏠", label: "Dashboard" },
          { id: "stok", icon: "📦", label: "Monitor Stok" },
        ],
      },
      {
        section: "Transaksi",
        items: [
          { id: "pemakaian", icon: "💊", label: "Pemakaian" },
          { id: "retur", icon: "↩️", label: "Retur ke Dinkes" },
        ],
      },
      {
        section: "Laporan",
        items: [{ id: "laporan", icon: "📊", label: "Laporan" }],
      },
    ],
    []
  );

  const nav = user?.role === "dinkes" ? navDinkes : navPuskesmas;

  const pageTitle = {
    dashboard: "Dashboard",
    stok: "Monitor Stok",
    "master-obat": "Master Obat",
    "master-batch": "Master Batch",
    pembelian: "Pembelian",
    distribusi: "Distribusi",
    pemakaian: "Pemakaian",
    retur: "Retur ke Dinkes",
    penghapusan: "Penghapusan",
    laporan: "Laporan",
  };

  if (!user) {
    return (
      <>
        <style>{globalStyles}</style>
        <LoginPage
          onLoggedIn={(u) => {
            const nu = normalizeUser(u);
            setUser(nu);
            localStorage.setItem("sigo_user", JSON.stringify(nu));
          }}
        />
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>

      <div className="sigo-app">
        <Sidebar
          user={user}
          gudangList={gudangList}
          nav={nav}
          activePage={activePage}
          setActivePage={setActivePage}
          onLogout={handleLogout}
        />

        <main className="main-content">
          <Topbar title={pageTitle[activePage] || activePage} />

          <div className="page-content">
            {activePage === "dashboard" && (
              <Dashboard
                user={user}
                stokData={stokData}
                onNavigate={setActivePage}
              />
            )}

            {activePage === "stok" && (
              <StokMonitor
                user={user}
                gudangList={gudangList}
                stokData={stokData}
                reloadStok={reloadStok}
              />
            )}

            {activePage === "master-obat" && user.role === "dinkes" && <MasterObat />}
            {activePage === "master-batch" && user.role === "dinkes" && <MasterBatch />}

            {activePage === "pembelian" && user.role === "dinkes" && (
              <Pembelian user={user} reloadStok={reloadStok} />
            )}

            {activePage === "distribusi" && user.role === "dinkes" && (
              <Distribusi
                user={user}
                gudangList={gudangList}
                stokData={stokData}
                reloadStok={reloadStok}
              />
            )}

            {activePage === "penghapusan" && user.role === "dinkes" && (
              <Penghapusan
                user={user}
                stokData={stokData}
                reloadStok={reloadStok}
              />
            )}

            {activePage === "pemakaian" && user.role === "puskesmas" && (
              <Pemakaian
                user={user}
                stokData={stokData}
                reloadStok={reloadStok}
              />
            )}

            {activePage === "retur" && user.role === "puskesmas" && (
              <Retur
                user={user}
                stokData={stokData}
                reloadStok={reloadStok}
              />
            )}

            {activePage === "laporan" && (
              <Laporan
                user={user}
                gudangList={gudangList}
                stokData={stokData}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
}