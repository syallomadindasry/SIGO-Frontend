// File: frontend/src/styles/globalStyles.js
export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --primary:#0F4C81;--primary-light:#1A6BB5;--primary-dark:#0A3560;
    --accent:#00C896;--danger:#E53E3E;--warning:#F6C000;--success:#38A169;
    --bg:#F0F4F8;--card:#fff;--border:#D9E2EC;--text:#1A202C;--text-muted:#718096;
    --sidebar-w:260px;
  }
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text)}
  code{background:#F7FAFC;border:1px solid var(--border);padding:2px 6px;border-radius:8px}
  .sigo-app{display:flex;min-height:100vh}

  /* COMMON */
  .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:16px}
  .card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px}
  .card-title{font-weight:800;font-size:15px}
  .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .muted{color:var(--text-muted)}
  .btn{padding:10px 14px;border:none;border-radius:10px;font-weight:700;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:8px}
  .btn:disabled{opacity:.6;cursor:not-allowed}
  .btn-primary{background:var(--primary);color:#fff}
  .btn-primary:hover{background:var(--primary-dark);transform:translateY(-1px)}
  .btn-secondary{background:var(--border);color:var(--text)}
  .btn-danger{background:var(--danger);color:#fff}
  .btn-warning{background:var(--warning);color:#111}
  .btn-success{background:var(--success);color:#fff}
  .btn-sm{padding:7px 10px;font-size:12px;border-radius:9px}
  .input, select, textarea{
    width:100%;padding:10px 12px;border:2px solid var(--border);border-radius:10px;outline:none;font-family:'DM Sans',sans-serif
  }
  .input:focus, select:focus, textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(15,76,129,.1)}
  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .col-2{grid-column:span 2}
  .label{font-size:12px;font-weight:800;margin-bottom:6px}
  .badge{padding:4px 10px;border-radius:999px;font-size:11px;font-weight:900;display:inline-block}
  .badge-info{background:#BEE3F8;color:#2A4365}
  .badge-success{background:#C6F6D5;color:#22543D}
  .badge-danger{background:#FED7D7;color:#742A2A}
  .badge-warning{background:#FEFCBF;color:#7B341E}

  /* TABLE */
  .table-wrap{overflow:auto;border:1px solid var(--border);border-radius:12px}
  table{width:100%;border-collapse:collapse}
  th{background:#F7FAFC;text-align:left;padding:10px 12px;font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border)}
  td{padding:10px 12px;border-bottom:1px solid #EEF2F7;font-size:13.5px}
  tr:hover td{background:#F7FAFC}
  tr:last-child td{border-bottom:none}

  /* SIDEBAR */
  .sidebar{width:var(--sidebar-w);background:var(--primary);min-height:100vh;position:fixed;left:0;top:0;z-index:50;display:flex;flex-direction:column;box-shadow:4px 0 20px rgba(0,0,0,.15)}
  .sidebar-header{padding:22px 18px;border-bottom:1px solid rgba(255,255,255,.12)}
  .sidebar-logo{display:flex;gap:10px;align-items:center}
  .sidebar-logo-icon{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--accent),#00A87E);display:flex;align-items:center;justify-content:center;font-size:20px}
  .sidebar-logo h2{font-family:'Playfair Display',serif;color:#fff;font-size:20px}
  .sidebar-logo p{color:rgba(255,255,255,.6);font-size:10px;margin-top:1px}
  .sidebar-user{padding:14px 18px;background:rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.12)}
  .user-name{color:#fff;font-weight:900}
  .user-role{margin-top:4px;color:var(--accent);font-weight:900;font-size:11px;background:rgba(0,200,150,.2);padding:2px 10px;border-radius:999px;display:inline-block}
  .sidebar-nav{padding:12px 10px;overflow:auto;flex:1}
  .nav-section-title{padding:10px 10px 6px;font-size:10px;color:rgba(255,255,255,.4);font-weight:900;letter-spacing:1.5px;text-transform:uppercase}
  .nav-item{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;color:rgba(255,255,255,.75);font-weight:700;cursor:pointer;transition:.15s}
  .nav-item:hover{background:rgba(255,255,255,.12);color:#fff}
  .nav-item.active{background:rgba(255,255,255,.16);color:#fff}
  .sidebar-footer{padding:14px 18px;border-top:1px solid rgba(255,255,255,.12)}
  /* ===== SIDEBAR BRAND (FIX) ===== */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-brand-logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 10px;
}

.sidebar-brand-title {
  font-weight: 800;
  font-size: 18px;
  color: #fff;
  line-height: 1.1;
}

.sidebar-brand-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 2px;
}

/* NAV ITEM: jangan div clickable, pakai button supaya pasti bisa di klik */
.nav-item {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
}

.nav-icon {
  width: 22px;
  display: inline-flex;
  justify-content: center;
}

.nav-label {
  display: inline-block;
}

/* LOGOUT */
.sidebar-logout {
  width: 100%;
  border: 0;
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-weight: 700;
}
.sidebar-logout:hover {
  background: rgba(255, 255, 255, 0.22);
}

  /* MAIN */
  .main-content{margin-left:var(--sidebar-w);flex:1}
  .topbar{position:sticky;top:0;z-index:40;background:#fff;border-bottom:1px solid var(--border);padding:14px 22px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,.06)}
  .topbar h1{font-size:18px;font-weight:900}
  .page-content{padding:22px}

  /* LOGIN */
  .login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0F4C81 0%,#1A6BB5 50%,#00C896 100%);position:relative;overflow:hidden}
  .login-wrap::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 20%,rgba(255,255,255,.18),transparent 40%),radial-gradient(circle at 90% 30%,rgba(255,255,255,.12),transparent 40%)}
  .login-card{width:420px;background:#fff;border-radius:22px;box-shadow:0 25px 60px rgba(0,0,0,.2);padding:42px 34px;position:relative;z-index:1}
  .login-logo{text-align:center;margin-bottom:24px}
  .logo-icon{width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,#0F4C81,#00C896);display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:10px}
  .login-logo h1{font-family:'Playfair Display',serif;font-size:28px;color:var(--primary)}
  .login-logo p{color:var(--text-muted);font-size:13px;margin-top:2px}

  /* MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:18px}
  .modal{width:100%;max-width:760px;background:#fff;border-radius:16px;box-shadow:0 25px 60px rgba(0,0,0,.25);overflow:hidden}
  .modal-header{padding:16px 18px;background:linear-gradient(135deg,var(--primary),var(--primary-light));color:#fff;display:flex;align-items:center;justify-content:space-between}
  .modal-body{padding:18px}
  .modal-footer{padding:14px 18px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end;background:#fff}
  .xbtn{background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:10px;padding:4px 10px;cursor:pointer;font-size:18px}
`;
