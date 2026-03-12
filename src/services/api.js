// File: frontend/src/services/api.js

/**
 * Strategy:
 * - Jika VITE_API_BASE diset → pakai itu.
 * - Kalau sedang dev (port 5173/5174) → pakai "/api" (harus ada proxy Vite).
 * - Selain itu → pakai "/sigo-project/backend/api" (untuk build ditaruh di Apache).
 */
const envBase = import.meta?.env?.VITE_API_BASE
  ? String(import.meta.env.VITE_API_BASE)
  : "";

const isDevPort = ["5173", "5174"].includes(String(window.location.port || ""));
const defaultBase = "http://localhost/SIGOO/SIGO/backend/api";

const RAW_BASE = envBase || defaultBase;
const API_BASE = RAW_BASE.replace(/\/+$/, "");

function joinUrl(base, path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${base}/${cleanPath}`;
}

function authHeaders(extra = {}) {
  const token = localStorage.getItem("sigo_token");
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJsonStrict(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const text = await res.text();

  const looksLikeJson = ct.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("[");
  if (!looksLikeJson) {
    throw new Error(
      `API tidak mengembalikan JSON (kemungkinan kena Vite/route salah). URL: ${res.url}`
    );
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Gagal parse JSON dari API. URL: ${res.url}`);
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || "Request gagal";
    throw new Error(msg);
  }
  return data;
}

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const res = await fetch(joinUrl(API_BASE, path), {
    method,
    headers: authHeaders(headers),
    body,
  });
  return parseJsonStrict(res);
}

// ===== AUTH =====
export async function login(nama, password) {
  const data = await request("login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: nama, password }),
  });

  if (!data?.token) {
    throw new Error("Login gagal: token tidak ditemukan (response API tidak valid).");
  }
  return data;
}

export async function me() {
  return request("me.php");
}

// ===== MASTER =====
export async function getGudang() {
  return request("gudang.php");
}

export async function getObat(q = "") {
  const url = new URL(joinUrl(API_BASE, "obat.php"), window.location.origin);
  if (q) url.searchParams.set("q", q);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

export async function addObat(payload) {
  return request("obat.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function editObat(payload) {
  return request("obat.php", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteObat(id) {
  const url = new URL(joinUrl(API_BASE, "obat.php"), window.location.origin);
  url.searchParams.set("id", String(id));
  const res = await fetch(url.toString(), { method: "DELETE", headers: authHeaders() });
  return parseJsonStrict(res);
}

// ===== BATCH =====
export async function getBatch(id_obat = 0) {
  const url = new URL(joinUrl(API_BASE, "batch.php"), window.location.origin);
  if (id_obat) url.searchParams.set("id_obat", String(id_obat));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

export async function addBatch(payload) {
  return request("batch.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function editBatch(payload) {
  return request("batch.php", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteBatch(id) {
  const url = new URL(joinUrl(API_BASE, "batch.php"), window.location.origin);
  url.searchParams.set("id", String(id));
  const res = await fetch(url.toString(), { method: "DELETE", headers: authHeaders() });
  return parseJsonStrict(res);
}

// ===== STOK =====
export async function getStok(id_gudang = 0) {
  const url = new URL(joinUrl(API_BASE, "stok.php"), window.location.origin);
  if (id_gudang) url.searchParams.set("id_gudang", String(id_gudang));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

// ===== TRANSAKSI =====
export async function getPembelian(id_gudang = 0) {
  const url = new URL(joinUrl(API_BASE, "pembelian.php"), window.location.origin);
  if (id_gudang) url.searchParams.set("id_gudang", String(id_gudang));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

export async function getPembelianDetail(id) {
  const url = new URL(joinUrl(API_BASE, "pembelian.php"), window.location.origin);
  url.searchParams.set("id", String(id));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

export async function savePembelianMaster(payload) {
  return request("pembelian.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, type: "master" }),
  });
}

export async function savePembelianDetail(payload) {
  return request("pembelian.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, type: "detail" }),
  });
}

export async function getDistribusi(id_gudang = 0) {
  const url = new URL(joinUrl(API_BASE, "distribusi.php"), window.location.origin);
  if (id_gudang) url.searchParams.set("id_gudang", String(id_gudang));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

export async function getDistribusiDetail(id) {
  const url = new URL(joinUrl(API_BASE, "distribusi.php"), window.location.origin);
  url.searchParams.set("id", String(id));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

export async function saveDistribusiMaster(payload) {
  return request("distribusi.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, type: "master" }),
  });
}

export async function saveDistribusiDetail(payload) {
  return request("distribusi.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, type: "detail" }),
  });
}

export async function getPemakaian(id_gudang = 0) {
  const url = new URL(joinUrl(API_BASE, "pemakaian.php"), window.location.origin);
  if (id_gudang) url.searchParams.set("id_gudang", String(id_gudang));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

export async function getPemakaianDetail(id) {
  const url = new URL(joinUrl(API_BASE, "pemakaian.php"), window.location.origin);
  url.searchParams.set("id", String(id));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

export async function savePemakaianMaster(payload) {
  return request("pemakaian.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, type: "master" }),
  });
}

export async function savePemakaianDetail(payload) {
  return request("pemakaian.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, type: "detail" }),
  });
}

export async function getRetur(id_gudang = 0) {
  const url = new URL(joinUrl(API_BASE, "retur.php"), window.location.origin);
  if (id_gudang) url.searchParams.set("id_gudang", String(id_gudang));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

export async function getReturDetail(id) {
  const url = new URL(joinUrl(API_BASE, "retur.php"), window.location.origin);
  url.searchParams.set("id", String(id));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

export async function saveReturMaster(payload) {
  return request("retur.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, type: "master" }),
  });
}

export async function saveReturDetail(payload) {
  return request("retur.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, type: "detail" }),
  });
}

export async function getPenghapusan(id_gudang = 0) {
  const url = new URL(joinUrl(API_BASE, "penghapusan.php"), window.location.origin);
  if (id_gudang) url.searchParams.set("id_gudang", String(id_gudang));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

export async function getPenghapusanDetail(id) {
  const url = new URL(joinUrl(API_BASE, "penghapusan.php"), window.location.origin);
  url.searchParams.set("id", String(id));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  return parseJsonStrict(res);
}

export async function savePenghapusanMaster(payload) {
  return request("penghapusan.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, type: "master" }),
  });
}

export async function savePenghapusanDetail(payload) {
  return request("penghapusan.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, type: "detail" }),
  });
}

// ===== DASHBOARD =====
export async function getDashboardSummary(id_gudang = 0, role = "") {
  const url = new URL(joinUrl(API_BASE, "dashboard_summary.php"), window.location.origin);

  if (id_gudang) url.searchParams.set("id_gudang", String(id_gudang));
  if (role) url.searchParams.set("role", String(role));

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
  });

  return parseJsonStrict(res);
}

export async function getDistribusiBulanan(months = 6, id_gudang = 0, role = "") {
  const url = new URL(joinUrl(API_BASE, "dashboard_distribusi_bulanan.php"), window.location.origin);

  url.searchParams.set("months", String(months));
  if (id_gudang) url.searchParams.set("id_gudang", String(id_gudang));
  if (role) url.searchParams.set("role", String(role));

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
  });

  return parseJsonStrict(res);
}