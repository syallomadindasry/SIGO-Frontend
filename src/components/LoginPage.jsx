// File: frontend/src/components/LoginPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as api from "../services/api.js";
import logoSigo from "../assets/logosigo.png";

function normalizeWarehouse(user) {
  const wh = user?.warehouse || user?.gudang || null;
  if (!wh) return null;
  return { name: wh.name ?? "-", type: wh.type ?? "-" };
}

function validate(form) {
  const errors = {};
  const nama = form.nama.trim();

  if (!nama) errors.nama = "Nama pengguna wajib diisi.";
  else if (nama.length < 3) errors.nama = "Nama pengguna minimal 3 karakter.";

  if (!form.password) errors.password = "Password wajib diisi.";
  else if (form.password.length < 4) errors.password = "Password minimal 4 karakter.";

  return errors;
}

export default function LoginPage({ onLoggedIn }) {
  const shellRef = useRef(null);

  const [form, setForm] = useState({ nama: "", password: "" });
  const [touched, setTouched] = useState({ nama: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({});
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [successStep, setSuccessStep] = useState(false);
  const [detected, setDetected] = useState(null);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    const errs = validate(form);
    return Object.keys(errs).length === 0;
  }, [form, loading]);

  useEffect(() => {
    setFieldErrors(validate(form));
  }, [form]);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mq?.matches) return;

    let raf = 0;
    const onMove = (e) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;

        const mx = Math.max(-1, Math.min(1, (px - 0.5) * 2));
        const my = Math.max(-1, Math.min(1, (py - 0.5) * 2));

        el.style.setProperty("--mx", mx.toFixed(3));
        el.style.setProperty("--my", my.toFixed(3));
      });
    };

    const onLeave = () => {
      el.style.setProperty("--mx", "0");
      el.style.setProperty("--my", "0");
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  async function handleSubmit(e) {
    e?.preventDefault?.();
    setError("");
    setSuccessStep(false);
    setDetected(null);

    const errs = validate(form);
    setFieldErrors(errs);
    setTouched({ nama: true, password: true });
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await api.login(form.nama.trim(), form.password);

      const storage = remember ? window.localStorage : window.sessionStorage;
      storage.setItem("sigo_token", res.token);
      if (res?.user) storage.setItem("sigo_user", JSON.stringify(res.user));

      const wh = normalizeWarehouse(res?.user);
      if (wh) setDetected(wh);

      setSuccessStep(true);
      setTimeout(() => onLoggedIn?.(res?.user || null), 650);
    } catch (err) {
      setError(err?.message || "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  const showNamaError = touched.nama && fieldErrors.nama;
  const showPassError = touched.password && fieldErrors.password;

  return (
    <>
      <style>{styles}</style>

      <div className="lp-shell" ref={shellRef}>
        <div className="lp-blob lp-blob-a lp-blob-anim" />
        <div className="lp-blob lp-blob-b lp-blob-anim2" />
        <div className="lp-blob lp-blob-c lp-blob-anim3" />

        <div className="lp-card lp-animated-border lp-card-fx">
          <span className="lp-deco lp-ring lp-ring-tl" aria-hidden="true" />
          <span className="lp-deco lp-ring lp-ring-br" aria-hidden="true" />
          <span className="lp-deco lp-dots lp-dots-l" aria-hidden="true" />
          <span className="lp-deco lp-dots lp-dots-r" aria-hidden="true" />
          <span className="lp-deco lp-spark lp-spark-top" aria-hidden="true" />
          <span className="lp-deco lp-spark lp-spark-bot" aria-hidden="true" />
          <span className="lp-deco lp-med lp-med-left" aria-hidden="true" />
          <span className="lp-deco lp-med lp-med-right" aria-hidden="true" />

          <header className="lp-header">
            <img className="lp-logo" src={logoSigo} alt="SIGO" />
            <div className="lp-subtitle">DINAS KESEHATAN DAN PUSKESMAS</div>
          </header>

          {error ? (
            <div className="lp-alert lp-alert-danger" role="alert">
              <div className="lp-alert-title">❌ Gagal</div>
              <div className="lp-alert-body">{error}</div>
            </div>
          ) : null}

          {successStep ? (
            <div className="lp-alert lp-alert-success" role="status">
              <div className="lp-alert-title">✅ Login berhasil</div>
              <div className="lp-alert-body" style={{ marginTop: 6 }}>
                {detected ? (
                  <>
                    Terdeteksi gudang: <b>{detected.name}</b>{" "}
                    <span className="lp-pill">{detected.type}</span>
                  </>
                ) : (
                  <>Gudang tidak terdeteksi.</>
                )}
              </div>
              <div className="lp-muted" style={{ marginTop: 6 }}>
                Mengalihkan…
              </div>
            </div>
          ) : null}

          <form className="lp-form" onSubmit={handleSubmit} noValidate>
            <div className="lp-field">
              <label htmlFor="lp-nama">👤 USERNAME</label>
              <input
                id="lp-nama"
                value={form.nama}
                onChange={(e) => setForm((s) => ({ ...s, nama: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, nama: true }))}
                placeholder="Masukkan Username Anda"
                autoComplete="username"
                aria-invalid={Boolean(showNamaError)}
              />
              {showNamaError ? (
                <div className="lp-field-error">{fieldErrors.nama}</div>
              ) : null}
            </div>

            <div className="lp-field">
              <label htmlFor="lp-pass">🔑 PASSWORD</label>
              <div className="lp-pass" data-invalid={Boolean(showPassError)}>
                <input
                  id="lp-pass"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="Masukkan Password Anda"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={Boolean(showPassError)}
                />
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                  title={showPass ? "Sembunyikan" : "Tampilkan"}
                >
                  {showPass ? "👁️" : "🙈"}
                </button>
              </div>
              {showPassError ? (
                <div className="lp-field-error">{fieldErrors.password}</div>
              ) : null}
            </div>

            <div className="lp-row">
              <label className="lp-check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Ingat saya</span>
              </label>

              <button
                type="button"
                className="lp-link"
                onClick={() => setError("Hubungi admin untuk reset password.")}
              >
                Lupa password?
              </button>
            </div>

            <div className="lp-actions">
              <button className="lp-btn" type="submit" disabled={!canSubmit}>
                {loading ? (
                  <span className="lp-btn-inner">
                    <span className="lp-spinner" aria-hidden="true" />
                    Memproses...
                  </span>
                ) : (
                  "🔓 LOGIN"
                )}
              </button>
            </div>
          </form>

          <footer className="lp-foot">© 2026 - SIGO - Dinkes &amp; Puskesmas</footer>
        </div>
      </div>
    </>
  );
}

const styles = `
:root{
  --lp-white: rgba(255,255,255,.94);

  /* glass tint (lebih gelap sedikit) */
  --lp-glass: rgba(10, 26, 40, .26);
  --lp-glass-2: rgba(255,255,255,.10);

  --lp-border: rgba(255,255,255,.22);
  --lp-text: rgba(255,255,255,.96);
  --lp-text-dim: rgba(255,255,255,.82);
  --lp-shadow: 0 26px 70px rgba(0,0,0,.22);

  --lp-teal: #18d1c8;
  --lp-teal2: #12bfb7;
}

.lp-shell{ --mx: 0; --my: 0; }

@keyframes lpFloat { 0%,100%{transform:translate3d(0,0,0)} 50%{transform:translate3d(0,-6px,0)} }
@keyframes lpDrift { 0%,100%{transform:translate3d(0,0,0) rotate(0deg)} 50%{transform:translate3d(6px,-4px,0) rotate(3deg)} }
@keyframes lpBorderShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes lpBlobA { 0%,100%{transform:translate(-10px,-8px) scale(1)} 50%{transform:translate(18px,12px) scale(1.06)} }
@keyframes lpBlobB { 0%,100%{transform:translate(8px,10px) scale(1)} 50%{transform:translate(-14px,-10px) scale(1.08)} }
@keyframes lpBlobC { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(10px,-16px) scale(1.05)} }
@keyframes lpShine { 0%{transform:translateX(-60%) rotate(12deg); opacity:.0} 30%{opacity:.16} 60%{opacity:.06} 100%{transform:translateX(120%) rotate(12deg); opacity:0} }
@keyframes lpSpin { to { transform: rotate(360deg); } }

.lp-shell{
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:24px;
  position:relative;
  overflow:hidden;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;

  /* lebih gelap sedikit + tetap hidup */
  background:
    radial-gradient(1100px 650px at 18% 18%, rgba(255,255,255,.16), transparent 62%),
    radial-gradient(900px 560px at 82% 72%, rgba(0,0,0,.28), transparent 58%),
    linear-gradient(135deg, #1b86d6 0%, #0aa6b0 50%, #18c7a0 100%);
}

.lp-blob{ position:absolute; filter:blur(18px); opacity:.30; border-radius:999px; pointer-events:none }
.lp-blob-a{ width:560px;height:560px;background:#ffffff;left:-220px;top:-220px; opacity:.18 }
.lp-blob-b{ width:560px;height:560px;background:#003cff;right:-280px;bottom:-260px; opacity:.18 }
.lp-blob-c{ width:420px;height:420px;background:#00ffd1;left:55%;top:-160px; opacity:.12 }
.lp-blob-anim{ animation: lpBlobA 10.5s ease-in-out infinite; }
.lp-blob-anim2{ animation: lpBlobB 12.5s ease-in-out infinite; }
.lp-blob-anim3{ animation: lpBlobC 14.5s ease-in-out infinite; }

/* ==== GLASS PANEL ==== */
.lp-animated-border{
  position:relative;
  border-radius:28px;
  overflow:hidden;
}
.lp-animated-border::before{
  content:"";
  position:absolute;
  inset:-2px;
  background: linear-gradient(90deg,
    rgba(255,255,255,.55),
    rgba(120,255,211,.45),
    rgba(11,179,209,.45),
    rgba(169,215,255,.45),
    rgba(255,255,255,.55)
  );
  background-size: 300% 300%;
  animation: lpBorderShift 8.5s ease-in-out infinite;
  opacity:.55;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding:2px;
  border-radius:30px;
  pointer-events:none;
}
.lp-animated-border::after{
  content:"";
  position:absolute;
  inset:0;

  /* glass tint + blur (inti efek kaca) */
  background:
    radial-gradient(900px 420px at 15% 18%, rgba(255,255,255,.10), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,.08), rgba(0,0,0,.08)),
    var(--lp-glass);

  backdrop-filter: blur(16px) saturate(1.25);
  -webkit-backdrop-filter: blur(16px) saturate(1.25);

  border:1px solid var(--lp-border);
  border-radius:28px;
  box-shadow: var(--lp-shadow);
  pointer-events:none;
}

.lp-card{
  width:min(560px,92vw);
  padding:26px;
}
.lp-card > *{ position:relative; z-index:2; }

.lp-card-fx{
  transform: translateZ(0);
  transition: transform .18s ease;
}
.lp-card-fx:hover{
  transform: translateY(-2px) rotateX(.6deg) rotateY(-.8deg);
}
.lp-card-fx .lp-header::after{
  content:"";
  position:absolute;
  inset:-40px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
  width:45%;
  transform: translateX(-60%) rotate(12deg);
  animation: lpShine 7.5s ease-in-out infinite;
  opacity:.0;
  pointer-events:none;
}

.lp-deco{
  position:absolute;
  pointer-events:none;
  z-index:1;
  transform: translate3d(calc(var(--mx) * var(--px, 0px)), calc(var(--my) * var(--py, 0px)), 0);
  will-change: transform;
}

.lp-ring{
  width:180px; height:180px;
  border-radius:999px;
  border:2px solid rgba(255,255,255,.18);
  box-shadow: inset 0 0 0 10px rgba(255,255,255,.05);
  filter: blur(.2px);
  opacity:.55;
  animation: lpDrift 7s ease-in-out infinite;
  --px: 10px; --py: 10px;
}
.lp-ring-tl{ left:-78px; top:-78px }
.lp-ring-br{ right:-86px; bottom:-86px; animation-duration:8.2s; opacity:.45; --px: 14px; --py: 14px; }

.lp-dots{
  width:180px; height:120px;
  opacity:.30;
  background-image: radial-gradient(rgba(255,255,255,.65) 1.4px, transparent 1.6px);
  background-size: 14px 14px;
  filter: blur(.2px);
  animation: lpFloat 6s ease-in-out infinite;
  --px: 16px; --py: 12px;
}
.lp-dots-l{ left:-48px; top:170px }
.lp-dots-r{ right:-58px; top:210px; animation-duration:6.8s; --px: 18px; --py: 14px; }

.lp-spark{
  width:160px; height:160px;
  opacity:.18;
  background:
    radial-gradient(circle at 30% 30%, rgba(255,255,255,.80) 0 2px, transparent 3px),
    radial-gradient(circle at 72% 28%, rgba(255,255,255,.80) 0 1.6px, transparent 3px),
    radial-gradient(circle at 58% 62%, rgba(255,255,255,.80) 0 1.8px, transparent 3px),
    radial-gradient(circle at 22% 70%, rgba(255,255,255,.80) 0 1.4px, transparent 3px),
    radial-gradient(circle at 78% 76%, rgba(255,255,255,.80) 0 1.2px, transparent 3px);
  filter: blur(.25px);
  animation: lpFloat 5.5s ease-in-out infinite;
  --px: 20px; --py: 18px;
}
.lp-spark-top{ right:-40px; top:-30px }
.lp-spark-bot{ left:-46px; bottom:-34px; animation-duration:6.2s; }

.lp-med{
  width:180px;
  height:260px;
  opacity:.16;
  filter: blur(.15px);
  animation: lpFloat 7.2s ease-in-out infinite;
  background-repeat: repeat;
  background-size: 64px 64px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Cg fill='none' stroke='white' stroke-opacity='.75' stroke-width='2'%3E%3Cpath d='M32 10v18M23 19h18'/%3E%3Cpath d='M18 46h10M23 41v10'/%3E%3Cpath d='M43 44l6 6M49 44l-6 6'/%3E%3C/g%3E%3C/svg%3E");
  --px: 22px; --py: 16px;
}
.lp-med-left{ left:-64px; top:70px }
.lp-med-right{ right:-64px; top:110px; animation-duration:8.1s; opacity:.13; --px: 26px; --py: 18px; }

.lp-header{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:10px;
  margin-bottom:14px;
  position:relative;
}

.lp-logo{
  width: clamp(290px, 40vw, 390px);
  height:auto;
  user-select:none;
  filter: drop-shadow(0 18px 34px rgba(0,0,0,.26));
}

.lp-subtitle{
  color:var(--lp-text);
  font-weight:900;
  letter-spacing:1px;
  text-align:center;
  font-size:13px;
  text-transform:uppercase;
}

.lp-alert{
  border-radius:16px;
  padding:12px 14px;
  margin:12px 0 10px;
  border:1px solid rgba(255,255,255,.18);
}
.lp-alert-title{ font-weight:900; color:var(--lp-text) }
.lp-alert-body{ color:var(--lp-text); opacity:.94; font-size:13px }
.lp-alert-danger{ background:rgba(255,84,84,.18); border-color:rgba(255,84,84,.28) }
.lp-alert-success{ background:rgba(88,255,160,.16); border-color:rgba(88,255,160,.26) }
.lp-muted{ opacity:.88; font-size:12px; color:var(--lp-text-dim) }

.lp-form{ margin-top:6px; }

.lp-field{ display:flex; flex-direction:column; gap:8px; margin-top:12px; }
.lp-field label{ color:var(--lp-text); font-size:13px; font-weight:800; }

/* input glass */
.lp-field input{
  border:1px solid rgba(255,255,255,.18);
  outline:none;
  border-radius:14px;
  padding:12px 14px;
  background: rgba(255,255,255,.10);
  backdrop-filter: blur(10px) saturate(1.2);
  -webkit-backdrop-filter: blur(10px) saturate(1.2);
  color:var(--lp-text);
  transition: box-shadow .15s ease, border-color .15s ease, background .15s ease;
}
.lp-field input::placeholder{ color:rgba(255,255,255,.70) }
.lp-field input:focus{
  border-color:rgba(24,209,200,.45);
  box-shadow:0 0 0 4px rgba(24,209,200,.14);
  background: rgba(255,255,255,.12);
}

.lp-field-error{
  margin-top:2px;
  font-size:12px;
  color: rgba(255,255,255,.92);
  opacity:.92;
}

/* password glass wrapper */
.lp-pass{
  display:flex;
  align-items:center;
  border:1px solid rgba(255,255,255,.18);
  border-radius:14px;
  overflow:hidden;
  background: rgba(255,255,255,.10);
  backdrop-filter: blur(10px) saturate(1.2);
  -webkit-backdrop-filter: blur(10px) saturate(1.2);
  transition: box-shadow .15s ease, border-color .15s ease, background .15s ease;
}
.lp-pass[data-invalid="true"]{
  border-color: rgba(255,84,84,.55);
  box-shadow:0 0 0 4px rgba(255,84,84,.14);
}
.lp-pass:focus-within{
  border-color:rgba(24,209,200,.45);
  box-shadow:0 0 0 4px rgba(24,209,200,.14);
  background: rgba(255,255,255,.12);
}
.lp-pass input{ flex:1; border:none; background:transparent; box-shadow:none; backdrop-filter:none; -webkit-backdrop-filter:none; }

.lp-eye{
  border:none;
  background:transparent;
  color:var(--lp-text);
  cursor:pointer;
  padding:0 12px;
  font-size:16px;
  opacity:.9;
  transition: transform .12s ease, opacity .12s ease;
}
.lp-eye:hover{ opacity:1; transform: translateY(-1px) }

.lp-row{
  margin-top:14px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
}

.lp-check{
  display:inline-flex;
  align-items:center;
  gap:10px;
  color: var(--lp-text);
  font-size:13px;
  font-weight:800;
  user-select:none;
}
.lp-check input{
  width:16px; height:16px;
  accent-color: var(--lp-teal);
}

.lp-link{
  border:none;
  background:transparent;
  color: rgba(255,255,255,.92);
  font-weight:900;
  font-size:13px;
  cursor:pointer;
  opacity:.9;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lp-link:hover{ opacity:1; }

.lp-actions{ margin-top:16px; display:flex; justify-content:center; }

/* tombol sedikit lebih gelap + kontras emoji tetap jelas */
.lp-btn{
  border:none;
  border-radius:999px;
  padding:10px 22px;
  font-weight:900;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(227, 235, 235, 1) 100%);
  color:#05212a;
  cursor:pointer;
  min-width:180px;
  box-shadow:0 16px 36px rgba(255, 255, 255, 0.22);
  transition: transform .12s ease, opacity .12s ease, filter .12s ease;
  font-size: 14px;
  letter-spacing: .2px;
  text-shadow: 0 1px 0 rgba(255,255,255,.18);
}
.lp-btn:hover{ transform: translateY(-1px); filter: brightness(1.04) saturate(1.05) }
.lp-btn:active{ transform: translateY(0px) }
.lp-btn:disabled{ opacity:.55; cursor:not-allowed; transform:none; filter:none }

.lp-btn-inner{ display:inline-flex; align-items:center; gap:10px; justify-content:center; }
.lp-spinner{
  width:16px; height:16px;
  border-radius:999px;
  border:2px solid rgba(5,33,42,.22);
  border-top-color: rgba(5,33,42,.90);
  animation: lpSpin .7s linear infinite;
}

.lp-pill{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:2px 10px;
  border-radius:999px;
  font-size:12px;
  font-weight:900;
  margin-left:6px;
  background:rgba(0,0,0,.22);
  border:1px solid rgba(255,255,255,.18);
  color:var(--lp-text);
}

.lp-foot{ margin-top:16px; text-align:center; color:var(--lp-text-dim); font-size:12px }

@media (prefers-reduced-motion: reduce){
  .lp-blob-anim,.lp-blob-anim2,.lp-blob-anim3,
  .lp-ring,.lp-dots,.lp-spark,.lp-med,
  .lp-animated-border::before,
  .lp-card-fx .lp-header::after,
  .lp-spinner{
    animation:none !important;
  }
  .lp-card-fx:hover{ transform:none; }
  .lp-deco{ transform:none !important; }
}
`;