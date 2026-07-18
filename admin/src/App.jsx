// Heartbeat Ministries Admin Console
// Dark/gold theme — Cormorant Garamond + DM Sans
// Wired to Git Gateway (content) + Supabase (prayers)

import { getCurrentUser, getJwt, logout, getUserEmail } from './api/auth.js';
import { getFile, putFile, deleteFile, listDir } from './api/git.js';
import { fetchPrayers, updatePrayerStatus, deletePrayer, fetchSiteViews, fetchPageStats, fetchViewSummary, fetchDailyViews, fetchTopReferrers } from './api/supabase.js';
import {
  buildScriptureMd, buildInspirationMd, buildBlogMd,
  buildTriviaMd, buildMemoryVerseMd, buildSettingsJson, slugify
} from './api/content.js';

const { useState, useEffect, useCallback } = React;

// ─── Icons ───────────────────────────────────────────────────────
const Icons = {
  Dashboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Scripture: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M12 6v7"/><path d="M9 9h6"/></svg>,
  Inspiration: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/></svg>,
  Blog: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Prayer: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>,
  Hero: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>,
  About: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
  Games: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4"/><path d="M8 10v4"/><circle cx="17" cy="10" r="1"/><circle cx="15" cy="14" r="1"/></svg>,
  Menu: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>,
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>,
  Save: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Back: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><polyline points="12,19 5,12 12,5"/></svg>,
  Logout: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>,
};

// ─── CSS ─────────────────────────────────────────────────────────
const css = `
  :root {
    --bg: #0c0a08; --surface: #161210; --surface2: #1e1a16;
    --border: rgba(196,164,116,.12); --gold: #c4a474; --gold-bright: #dbb867;
    --gold-dim: rgba(196,164,116,.08); --text: #e8e0d4; --text2: rgba(232,224,212,.55);
    --font-display: 'Cormorant Garamond', serif; --font-body: 'DM Sans', sans-serif;
    --danger: #c45454; --success: #5ab87a;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:var(--bg); color:var(--text); font-family:var(--font-body); }
  .admin-wrap { display:flex; min-height:100vh; }

  /* Sidebar */
  .sidebar {
    width:240px; background:var(--surface); border-right:1px solid var(--border);
    display:flex; flex-direction:column; position:fixed; top:0; left:0; bottom:0; z-index:100;
    transition: transform .25s ease;
  }
  .sidebar-brand {
    padding:24px 20px; border-bottom:1px solid var(--border);
    font-family:var(--font-display); font-size:1.3rem; color:var(--gold);
    font-weight:600; letter-spacing:.5px;
  }
  .sidebar-nav { flex:1; padding:12px 0; overflow-y:auto; }
  .nav-item {
    display:flex; align-items:center; gap:12px; padding:10px 20px;
    color:var(--text2); cursor:pointer; font-size:.875rem; font-weight:500;
    transition: all .15s; border:none; background:none; width:100%; text-align:left;
    font-family:var(--font-body);
  }
  .nav-item svg { width:18px; height:18px; flex-shrink:0; }
  .nav-item:hover { color:var(--gold); background:var(--gold-dim); }
  .nav-item.active { color:var(--gold); background:var(--gold-dim); }
  .sidebar-footer {
    padding:16px 20px; border-top:1px solid var(--border);
    font-size:.75rem; color:var(--text2);
  }
  .sidebar-footer button {
    display:flex; align-items:center; gap:8px; color:var(--text2);
    background:none; border:none; cursor:pointer; font-size:.8rem;
    font-family:var(--font-body); padding:4px 0;
  }
  .sidebar-footer button:hover { color:var(--gold); }
  .sidebar-footer button svg { width:16px; height:16px; }

  /* Main */
  .main { flex:1; margin-left:240px; padding:32px; min-height:100vh; }
  .main-header {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:28px; gap:16px;
  }
  .main-header h1 {
    font-family:var(--font-display); font-size:1.75rem; font-weight:600; color:var(--text);
  }

  /* Mobile toggle */
  .mobile-toggle {
    display:none; position:fixed; top:16px; left:16px; z-index:200;
    background:var(--surface); border:1px solid var(--border); border-radius:8px;
    padding:8px; color:var(--gold); cursor:pointer;
  }
  .mobile-toggle svg { width:22px; height:22px; }
  @media(max-width:768px) {
    .sidebar { transform:translateX(-100%); }
    .sidebar.open { transform:translateX(0); }
    .main { margin-left:0; padding:24px 16px; padding-top:56px; }
    .mobile-toggle { display:block; }
  }

  /* Cards */
  .card {
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    padding:20px; margin-bottom:16px;
  }
  .card-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; margin-bottom:24px; }
  .stat-card {
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    padding:20px; text-align:center;
  }
  .stat-card .stat-value { font-family:var(--font-display); font-size:2rem; color:var(--gold); font-weight:700; }
  .stat-card .stat-label { font-size:.8rem; color:var(--text2); margin-top:4px; }

  /* Form elements */
  .form-group { margin-bottom:16px; }
  .form-label {
    display:block; font-size:.8rem; color:var(--text2); margin-bottom:6px;
    font-weight:500; text-transform:uppercase; letter-spacing:.5px;
  }
  .form-input, .form-select, .form-textarea {
    width:100%; padding:10px 14px; background:var(--surface2); border:1px solid var(--border);
    border-radius:8px; color:var(--text); font-family:var(--font-body); font-size:.9rem;
    outline:none; transition: border-color .15s;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    border-color:var(--gold); box-shadow:0 0 0 2px var(--gold-dim);
  }
  .form-textarea { min-height:120px; resize:vertical; }

  /* Buttons */
  .btn {
    display:inline-flex; align-items:center; gap:8px; padding:10px 20px;
    border-radius:8px; font-size:.875rem; font-weight:600; cursor:pointer;
    border:none; font-family:var(--font-body); transition: all .15s;
  }
  .btn svg { width:16px; height:16px; }
  .btn-gold { background:var(--gold); color:var(--bg); }
  .btn-gold:hover { background:var(--gold-bright); }
  .btn-ghost { background:transparent; color:var(--text2); border:1px solid var(--border); }
  .btn-ghost:hover { color:var(--gold); border-color:var(--gold); }
  .btn-danger { background:var(--danger); color:#fff; }
  .btn-danger:hover { opacity:.85; }
  .btn-sm { padding:6px 14px; font-size:.8rem; }
  .btn:disabled { opacity:.5; cursor:not-allowed; }

  /* Table */
  .data-table { width:100%; border-collapse:collapse; }
  .data-table th {
    text-align:left; padding:10px 14px; font-size:.75rem; color:var(--text2);
    text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid var(--border);
  }
  .data-table td {
    padding:12px 14px; border-bottom:1px solid var(--border); font-size:.875rem;
  }
  .data-table tr:hover { background:var(--gold-dim); }
  .data-table tr { cursor:pointer; }

  /* List items */
  .list-item {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 18px; background:var(--surface); border:1px solid var(--border);
    border-radius:10px; margin-bottom:8px; cursor:pointer; transition: all .15s;
  }
  .list-item:hover { border-color:var(--gold); background:rgba(196,164,116,.04); }
  .list-item-title { font-weight:500; }
  .list-item-sub { font-size:.8rem; color:var(--text2); margin-top:2px; }

  /* Status badges */
  .badge {
    display:inline-block; padding:3px 10px; border-radius:20px; font-size:.75rem; font-weight:600;
  }
  .badge-new { background:rgba(196,164,116,.15); color:var(--gold); }
  .badge-prayed { background:rgba(90,184,122,.15); color:var(--success); }
  .badge-archived { background:rgba(232,224,212,.1); color:var(--text2); }

  /* Toggle */
  .toggle-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 0; border-bottom:1px solid var(--border);
  }
  .toggle-label { font-weight:500; }
  .toggle {
    width:44px; height:24px; border-radius:12px; cursor:pointer; position:relative;
    background:var(--surface2); border:1px solid var(--border); transition: all .2s;
  }
  .toggle.on { background:var(--gold); border-color:var(--gold); }
  .toggle::after {
    content:''; position:absolute; top:2px; left:2px; width:18px; height:18px;
    border-radius:50%; background:#fff; transition: transform .2s;
  }
  .toggle.on::after { transform:translateX(20px); }

  /* Toast */
  .toast {
    position:fixed; bottom:24px; right:24px; padding:14px 24px;
    background:var(--surface); border:1px solid var(--gold); border-radius:10px;
    color:var(--gold); font-weight:500; z-index:1000; animation: fadeIn .3s;
    box-shadow:0 8px 32px rgba(0,0,0,.4);
  }
  @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  /* Loading */
  .loading { text-align:center; padding:60px; color:var(--text2); }
  .spinner {
    display:inline-block; width:32px; height:32px; border:3px solid var(--border);
    border-top-color:var(--gold); border-radius:50%; animation:spin .8s linear infinite;
  }
  @keyframes spin { to{transform:rotate(360deg)} }

  /* Scrollbar */
  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:var(--bg); }
  ::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }
  ::-webkit-scrollbar-thumb:hover { background:var(--gold); }
`;

// ─── Toast Hook ──────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState(null);
  const show = useCallback((text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 3500);
  }, []);
  return [msg, show];
}

// ─── useCmsData Hook ─────────────────────────────────────────────
function useCmsData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/cms-data.json');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to load cms-data.json:', e);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

// ─── Dashboard Panel ─────────────────────────────────────────────
const PAGE_LABELS = { home: 'Home', blog: 'Blog', games: 'Games & Trivia', give: 'Give', prayer: 'Prayer' };
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Parse a 'YYYY-MM-DD' date string without timezone shifting.
function dayParts(iso) {
  const [y, m, dd] = (iso || '').split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, dd || 1);
  return { abbr: DAY_ABBR[dt.getDay()], num: dd };
}

function DailyBars({ daily }) {
  const max = Math.max(1, ...daily.map(r => Number(r.views) || 0));
  return (
    <div style={{display:'flex', alignItems:'flex-end', gap:10, height:110, marginTop:8}}>
      {daily.map(r => {
        const v = Number(r.views) || 0;
        const h = v === 0 ? 2 : Math.max(6, Math.round((v / max) * 72));
        const p = dayParts(r.day);
        return (
          <div key={r.day} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4}}
               title={r.day + ': ' + v + ' views, ' + (Number(r.visitors) || 0) + ' visitors'}>
            <div style={{fontSize:'.75rem', color: v ? 'var(--gold)' : 'var(--text2)'}}>{v}</div>
            <div style={{width:'100%', maxWidth:34, height:h, borderRadius:'4px 4px 0 0',
                         background: v ? 'var(--gold)' : 'var(--border)', opacity: v ? 1 : .6}} />
            <div style={{fontSize:'.68rem', color:'var(--text2)'}}>{p.abbr} {p.num}</div>
          </div>
        );
      })}
    </div>
  );
}

function DashboardPanel({ cmsData }) {
  const d = cmsData || {};
  const [views, setViews] = useState(null);
  const [summary, setSummary] = useState(null);
  const [pageStats, setPageStats] = useState(null);
  const [daily, setDaily] = useState(null);
  const [referrers, setReferrers] = useState(null);
  const [trackErr, setTrackErr] = useState(false);

  useEffect(() => {
    let active = true;
    fetchSiteViews()
      .then(v => { if (active) setViews(v); })
      .catch(() => { if (active) setViews(null); });
    Promise.all([fetchViewSummary(7), fetchPageStats(7), fetchDailyViews(7), fetchTopReferrers(30)])
      .then(([s, p, dl, rf]) => {
        if (!active) return;
        setSummary(s); setPageStats(p || []); setDaily(dl || []); setReferrers(rf || []);
      })
      .catch(() => { if (active) setTrackErr(true); });
    return () => { active = false; };
  }, []);

  const stats = [
    { label: 'Site Views', value: views == null ? '—' : views.toLocaleString() },
    { label: 'Scriptures', value: (d.scriptures || []).length },
    { label: 'Inspirations', value: (d.inspirations || []).length },
    { label: 'Blog Posts', value: (d.posts || []).length },
    { label: 'Trivia Qs', value: (d.trivia || []).length },
    { label: 'Memory Verses', value: (d.memoryVerses || []).length },
  ];

  const today = daily && daily.length ? daily[daily.length - 1] : null;
  const trackCards = summary ? [
    { label: 'Views (7 days)', value: Number(summary.views).toLocaleString() },
    { label: 'Visitors (7 days)', value: Number(summary.visitors).toLocaleString() },
    { label: 'Views Today', value: today ? Number(today.views).toLocaleString() : '0' },
    { label: 'Visitors Today', value: today ? Number(today.visitors).toLocaleString() : '0' },
  ] : [];
  const anyViews = pageStats && pageStats.length > 0;

  return (
    <div>
      <div className="card-grid">
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',marginBottom:4,color:'var(--gold)'}}>
          Visitor Tracking
        </h3>
        <p style={{color:'var(--text2)',fontSize:'.8rem',marginBottom:14}}>
          Real people only — bots and crawlers are filtered out. (The lifetime Site Views counter above still counts everything.)
        </p>
        {trackErr && (
          <p style={{color:'var(--text2)',fontSize:'.9rem'}}>Couldn't load tracking data. Refresh to try again.</p>
        )}
        {!trackErr && !summary && (
          <p style={{color:'var(--text2)',fontSize:'.9rem'}}>Loading…</p>
        )}
        {summary && (
          <div>
            <div className="card-grid" style={{marginBottom:8}}>
              {trackCards.map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{marginTop:10}}>
              <div className="form-label">Last 7 Days</div>
              <DailyBars daily={daily || []} />
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20, marginTop:18}}>
              <div>
                <div className="form-label">Pages (7 days)</div>
                {anyViews ? (
                  <table className="data-table">
                    <thead><tr><th>Page</th><th style={{textAlign:'right'}}>Views</th><th style={{textAlign:'right'}}>Visitors</th></tr></thead>
                    <tbody>
                      {pageStats.map(r => (
                        <tr key={r.page}>
                          <td>{PAGE_LABELS[r.page] || r.page}</td>
                          <td style={{textAlign:'right'}}>{Number(r.views).toLocaleString()}</td>
                          <td style={{textAlign:'right'}}>{Number(r.visitors).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{color:'var(--text2)',fontSize:'.85rem'}}>No visits recorded yet this week.</p>
                )}
              </div>
              <div>
                <div className="form-label">Traffic Sources (30 days)</div>
                {referrers && referrers.length ? (
                  <table className="data-table">
                    <thead><tr><th>Source</th><th style={{textAlign:'right'}}>Views</th></tr></thead>
                    <tbody>
                      {referrers.map(r => (
                        <tr key={r.source}>
                          <td>{r.source === '(direct)' ? 'Direct / bookmark' : r.source}</td>
                          <td style={{textAlign:'right'}}>{Number(r.views).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{color:'var(--text2)',fontSize:'.85rem'}}>No traffic sources yet.</p>
                )}
              </div>
            </div>

            <p style={{color:'var(--text2)',fontSize:'.72rem',marginTop:14}}>
              Tracking began July 18, 2026 · days are US Central time · a "visitor" is a unique browser per page.
            </p>
          </div>
        )}
      </div>
      <div className="card">
        <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',marginBottom:12,color:'var(--gold)'}}>
          Quick Info
        </h3>
        <p style={{color:'var(--text2)',fontSize:'.9rem',lineHeight:1.6}}>
          Welcome to the Heartbeat Ministries admin console. Use the sidebar to manage your site content.
          Changes are saved via Git — after publishing, the site will automatically rebuild.
        </p>
        {d.scriptures && d.scriptures[0] && (
          <div style={{marginTop:16,padding:14,background:'var(--surface2)',borderRadius:8}}>
            <div style={{fontSize:'.75rem',color:'var(--text2)',marginBottom:4}}>Latest Scripture</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:'1.1rem',color:'var(--gold)'}}>
              {d.scriptures[0].ref}
            </div>
            <div style={{fontSize:'.85rem',color:'var(--text2)',marginTop:4}}>
              {(d.scriptures[0].text || '').slice(0, 100)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Scripture Panel ─────────────────────────────────────────────
function ScripturePanel({ toast }) {
  const [scriptures, setScriptures] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScriptures();
  }, []);

  async function loadScriptures() {
    setLoading(true);
    try {
      const res = await fetch('/cms-data.json');
      const data = await res.json();
      setScriptures(data.scriptures || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function startEdit(s) {
    setEditing(s || {});
    setForm({
      date: s ? s.date : new Date().toISOString().slice(0, 10),
      text: s ? s.text : '',
      reference: s ? s.ref : '',
      translation: s ? s.translation : 'NIV',
      devotional: s ? s.thought : '',
      prayer: s ? s.prayer : ''
    });
  }

  async function save() {
    setSaving(true);
    try {
      const dateStr = form.date || new Date().toISOString().slice(0, 10);
      const path = 'content/scripture/' + dateStr + '.md';
      const content = buildScriptureMd(form);
      let sha = null;
      try {
        const existing = await getFile(path);
        if (existing) sha = existing.sha;
      } catch (e) {}
      await putFile(path, content, sha, 'Update scripture ' + dateStr);
      toast('Scripture saved! Site will rebuild in ~1 min.');
      setEditing(null);
    } catch (e) {
      toast('Error: ' + e.message);
    }
    setSaving(false);
  }

  if (loading) return <div className="loading"><div className="spinner"></div><p>Loading scriptures...</p></div>;

  if (editing !== null) {
    return (
      <div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)} style={{marginBottom:16}}>
          <Icons.Back /> Back to list
        </button>
        <div className="card">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Scripture Text</label>
            <textarea className="form-textarea" value={form.text || ''} onChange={e => setForm({...form, text: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Reference</label>
            <input className="form-input" value={form.reference || ''} onChange={e => setForm({...form, reference: e.target.value})} placeholder="e.g. John 3:16" />
          </div>
          <div className="form-group">
            <label className="form-label">Translation</label>
            <select className="form-select" value={form.translation || 'NIV'} onChange={e => setForm({...form, translation: e.target.value})}>
              {['NIV','ESV','KJV','NKJV','NLT','NASB'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Devotional Thought</label>
            <textarea className="form-textarea" value={form.devotional || ''} onChange={e => setForm({...form, devotional: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Related Prayer</label>
            <textarea className="form-textarea" value={form.prayer || ''} onChange={e => setForm({...form, prayer: e.target.value})} />
          </div>
          <div style={{display:'flex',gap:12,marginTop:20}}>
            <button className="btn btn-gold" onClick={save} disabled={saving}>
              <Icons.Save /> {saving ? 'Saving...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-gold btn-sm" onClick={() => startEdit(null)} style={{marginBottom:16}}>
        <Icons.Plus /> New Scripture
      </button>
      {scriptures.length === 0 ? (
        <div className="card" style={{textAlign:'center',color:'var(--text2)'}}>No scriptures yet.</div>
      ) : (
        scriptures.map((s, i) => (
          <div className="list-item" key={i} onClick={() => startEdit(s)}>
            <div>
              <div className="list-item-title">{s.ref}</div>
              <div className="list-item-sub">{s.date} — {s.translation}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Inspiration Panel ───────────────────────────────────────────
function InspirationPanel({ toast }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch('/cms-data.json');
      const data = await res.json();
      setItems(data.inspirations || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function startEdit(item) {
    setEditing(item || {});
    setForm({
      title: item ? item.title : '',
      body: item ? item.text : '',
      tag: item ? item.tag : '',
      order: item ? (item.order || 0) : 0,
      _slug: item ? item._slug : ''
    });
  }

  async function save() {
    setSaving(true);
    try {
      const slug = form._slug || slugify(form.title);
      const path = 'content/inspiration/' + slug + '.md';
      const content = buildInspirationMd(form);
      let sha = null;
      try {
        const existing = await getFile(path);
        if (existing) sha = existing.sha;
      } catch (e) {}
      await putFile(path, content, sha, 'Update inspiration: ' + form.title);
      toast('Inspiration saved! Site will rebuild in ~1 min.');
      setEditing(null);
    } catch (e) {
      toast('Error: ' + e.message);
    }
    setSaving(false);
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  if (editing !== null) {
    return (
      <div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)} style={{marginBottom:16}}>
          <Icons.Back /> Back
        </button>
        <div className="card">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Body</label>
            <textarea className="form-textarea" value={form.body || ''} onChange={e => setForm({...form, body: e.target.value})} style={{minHeight:180}} />
          </div>
          <div className="form-group">
            <label className="form-label">Tag</label>
            <input className="form-input" value={form.tag || ''} onChange={e => setForm({...form, tag: e.target.value})} placeholder="e.g. Encouragement, Hope" />
          </div>
          <div className="form-group">
            <label className="form-label">Order</label>
            <input type="number" className="form-input" value={form.order || 0} onChange={e => setForm({...form, order: parseInt(e.target.value)||0})} />
          </div>
          <button className="btn btn-gold" onClick={save} disabled={saving} style={{marginTop:12}}>
            <Icons.Save /> {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-gold btn-sm" onClick={() => startEdit(null)} style={{marginBottom:16}}>
        <Icons.Plus /> New Inspiration
      </button>
      {items.map((item, i) => (
        <div className="list-item" key={i} onClick={() => startEdit(item)}>
          <div>
            <div className="list-item-title">{item.title}</div>
            <div className="list-item-sub">{item.tag || 'No tag'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Blog Panel ──────────────────────────────────────────────────
function BlogPanel({ toast }) {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch('/cms-data.json');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function startEdit(post) {
    setEditing(post || {});
    setForm({
      title: post ? post.title : '',
      date: post ? post.date : new Date().toISOString().slice(0, 10),
      category: post ? post.category : 'Faith',
      excerpt: post ? post.excerpt : '',
      icon: post ? post.icon : '✝️',
      readTime: post ? post.readTime : '5 min read',
      body: post ? post.body : '',
      thumbnail: post ? post.thumbnail : '',
      draft: post ? post.draft : false,
      seo_description: post ? post.seo_description : '',
      _slug: post ? post.slug : ''
    });
  }

  async function save() {
    setSaving(true);
    try {
      const slug = form._slug || slugify(form.title);
      const path = 'content/blog/' + slug + '.md';
      const content = buildBlogMd(form);
      let sha = null;
      try {
        const existing = await getFile(path);
        if (existing) sha = existing.sha;
      } catch (e) {}
      await putFile(path, content, sha, 'Update blog: ' + form.title);
      toast('Blog post saved! Site will rebuild in ~1 min.');
      setEditing(null);
    } catch (e) {
      toast('Error: ' + e.message);
    }
    setSaving(false);
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  if (editing !== null) {
    const categories = ['Faith','Prayer','Scripture','Peace','Encouragement','Hope','Trust'];
    return (
      <div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)} style={{marginBottom:16}}>
          <Icons.Back /> Back
        </button>
        <div className="card">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category || 'Faith'} onChange={e => setForm({...form, category: e.target.value})}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Excerpt</label>
            <textarea className="form-textarea" value={form.excerpt || ''} onChange={e => setForm({...form, excerpt: e.target.value})} style={{minHeight:80}} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div className="form-group">
              <label className="form-label">Icon Emoji</label>
              <input className="form-input" value={form.icon || ''} onChange={e => setForm({...form, icon: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Read Time</label>
              <input className="form-input" value={form.readTime || ''} onChange={e => setForm({...form, readTime: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Thumbnail URL</label>
            <input className="form-input" value={form.thumbnail || ''} onChange={e => setForm({...form, thumbnail: e.target.value})} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label className="form-label">Body (Markdown)</label>
            <textarea className="form-textarea" value={form.body || ''} onChange={e => setForm({...form, body: e.target.value})} style={{minHeight:300,fontFamily:'monospace',fontSize:'.85rem'}} />
          </div>
          <div className="form-group">
            <label className="form-label">SEO Description</label>
            <input className="form-input" value={form.seo_description || ''} onChange={e => setForm({...form, seo_description: e.target.value})} />
          </div>
          <div className="toggle-row" style={{borderBottom:'none',marginBottom:12}}>
            <span className="toggle-label">Draft (hidden from live site)</span>
            <div className={'toggle' + (form.draft ? ' on' : '')} onClick={() => setForm({...form, draft: !form.draft})}></div>
          </div>
          <button className="btn btn-gold" onClick={save} disabled={saving}>
            <Icons.Save /> {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-gold btn-sm" onClick={() => startEdit(null)} style={{marginBottom:16}}>
        <Icons.Plus /> New Post
      </button>
      {posts.length === 0 ? (
        <div className="card" style={{textAlign:'center',color:'var(--text2)'}}>No blog posts yet.</div>
      ) : (
        posts.map((p, i) => (
          <div className="list-item" key={i} onClick={() => startEdit(p)}>
            <div>
              <div className="list-item-title">{p.icon} {p.title}</div>
              <div className="list-item-sub">{p.date} — {p.category}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Prayer Panel ────────────────────────────────────────────────
function PrayerPanel({ toast }) {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadPrayers(); }, []);

  async function loadPrayers() {
    setLoading(true);
    try {
      const data = await fetchPrayers();
      setPrayers(data || []);
    } catch (e) {
      console.error('Supabase error:', e);
      toast('Could not load prayers. Check Supabase key.');
    }
    setLoading(false);
  }

  async function setStatus(id, status) {
    try {
      await updatePrayerStatus(id, status);
      setPrayers(prev => prev.map(p => p.id === id ? {...p, status} : p));
      toast('Prayer status updated');
    } catch (e) {
      toast('Error: ' + e.message);
    }
  }

  const filtered = filter === 'all' ? prayers : prayers.filter(p => p.status === filter);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {['all','new','prayed','archived'].map(f => (
          <button key={f} className={'btn btn-sm ' + (filter === f ? 'btn-gold' : 'btn-ghost')}
            onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${prayers.length})` : `(${prayers.filter(p=>p.status===f).length})`}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="card" style={{textAlign:'center',color:'var(--text2)'}}>No prayer requests found.</div>
      ) : (
        filtered.map(p => (
          <div className="card" key={p.id}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <div>
                <strong>{p.name || 'Anonymous'}</strong>
                {p.email && <span style={{color:'var(--text2)',fontSize:'.8rem',marginLeft:8}}>{p.email}</span>}
              </div>
              <span className={'badge badge-' + (p.status || 'new')}>{p.status || 'new'}</span>
            </div>
            <p style={{color:'var(--text)',fontSize:'.9rem',lineHeight:1.6,marginBottom:12}}>
              {p.prayer_text}
            </p>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:'.75rem',color:'var(--text2)'}}>
                {new Date(p.created_at).toLocaleDateString()}
              </span>
              <div style={{flex:1}}></div>
              {p.status !== 'prayed' && (
                <button className="btn btn-sm btn-ghost" onClick={() => setStatus(p.id, 'prayed')}>
                  <Icons.Check /> Prayed
                </button>
              )}
              {p.status !== 'archived' && (
                <button className="btn btn-sm btn-ghost" onClick={() => setStatus(p.id, 'archived')}>
                  Archive
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Hero Panel ──────────────────────────────────────────────────
function HeroPanel({ toast }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/cms-data.json');
        const data = await res.json();
        setForm(data.hero || {});
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const path = 'content/settings/hero.json';
      const content = buildSettingsJson(form);
      let sha = null;
      try {
        const existing = await getFile(path);
        if (existing) sha = existing.sha;
      } catch (e) {}
      await putFile(path, content, sha, 'Update hero settings');
      toast('Hero section saved! Site will rebuild in ~1 min.');
    } catch (e) {
      toast('Error: ' + e.message);
    }
    setSaving(false);
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="card">
      <div className="form-group">
        <label className="form-label">Eyebrow Text</label>
        <input className="form-input" value={form.eyebrow || ''} onChange={e => setForm({...form, eyebrow: e.target.value})} />
      </div>
      <div className="form-group">
        <label className="form-label">Main Headline</label>
        <input className="form-input" value={form.headline || ''} onChange={e => setForm({...form, headline: e.target.value})} />
      </div>
      <div className="form-group">
        <label className="form-label">Subheadline</label>
        <textarea className="form-textarea" value={form.subheadline || ''} onChange={e => setForm({...form, subheadline: e.target.value})} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div className="form-group">
          <label className="form-label">Featured Verse Text</label>
          <input className="form-input" value={form.verse_text || ''} onChange={e => setForm({...form, verse_text: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Verse Reference</label>
          <input className="form-input" value={form.verse_ref || ''} onChange={e => setForm({...form, verse_ref: e.target.value})} />
        </div>
      </div>
      <button className="btn btn-gold" onClick={save} disabled={saving} style={{marginTop:12}}>
        <Icons.Save /> {saving ? 'Saving...' : 'Publish'}
      </button>
    </div>
  );
}

// ─── About Panel ─────────────────────────────────────────────────
function AboutPanel({ toast }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/cms-data.json');
        const data = await res.json();
        setForm(data.about || {});
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const path = 'content/settings/about.json';
      const content = buildSettingsJson(form);
      let sha = null;
      try {
        const existing = await getFile(path);
        if (existing) sha = existing.sha;
      } catch (e) {}
      await putFile(path, content, sha, 'Update about settings');
      toast('About section saved! Site will rebuild in ~1 min.');
    } catch (e) {
      toast('Error: ' + e.message);
    }
    setSaving(false);
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="card">
      <div className="form-group">
        <label className="form-label">Mission Statement</label>
        <textarea className="form-textarea" value={form.mission || ''} onChange={e => setForm({...form, mission: e.target.value})} style={{minHeight:140}} />
      </div>
      <div className="form-group">
        <label className="form-label">Mission Tags (comma-separated)</label>
        <input className="form-input" value={form.tags || ''} onChange={e => setForm({...form, tags: e.target.value})} />
      </div>
      <div className="form-group">
        <label className="form-label">Contact Email</label>
        <input className="form-input" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
      </div>
      <div className="form-group">
        <label className="form-label">Additional Info</label>
        <textarea className="form-textarea" value={form.additional || ''} onChange={e => setForm({...form, additional: e.target.value})} />
      </div>
      <button className="btn btn-gold" onClick={save} disabled={saving} style={{marginTop:12}}>
        <Icons.Save /> {saving ? 'Saving...' : 'Publish'}
      </button>
    </div>
  );
}

// ─── Games Panel ─────────────────────────────────────────────────
function GamesPanel({ toast }) {
  const [games, setGames] = useState({});
  const [trivia, setTrivia] = useState([]);
  const [memoryVerses, setMemoryVerses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingTrivia, setEditingTrivia] = useState(null);
  const [editingVerse, setEditingVerse] = useState(null);
  const [triviaForm, setTriviaForm] = useState({});
  const [verseForm, setVerseForm] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/cms-data.json');
        const data = await res.json();
        setGames(data.games || {});
        setTrivia(data.trivia || []);
        setMemoryVerses(data.memoryVerses || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  async function saveToggles() {
    setSaving(true);
    try {
      const path = 'content/settings/games.json';
      const content = buildSettingsJson(games);
      let sha = null;
      try {
        const existing = await getFile(path);
        if (existing) sha = existing.sha;
      } catch (e) {}
      await putFile(path, content, sha, 'Update games settings');
      toast('Games settings saved! Site will rebuild in ~1 min.');
    } catch (e) {
      toast('Error: ' + e.message);
    }
    setSaving(false);
  }

  function toggleGame(key) {
    setGames(prev => ({...prev, [key]: !prev[key]}));
  }

  // Trivia edit
  function startEditTrivia(t) {
    setEditingTrivia(t || {});
    setTriviaForm({
      q: t ? t.q : '', opts: t ? (t.opts || []).join('\n') : '',
      ans: t ? t.ans : 0, ref: t ? t.ref : '', explain: t ? t.explain : '',
      order: t ? (t.order || 0) : 0, _slug: t ? t._slug : ''
    });
  }

  async function saveTrivia() {
    setSaving(true);
    try {
      const opts = triviaForm.opts.split('\n').map(s => s.trim()).filter(Boolean);
      const slug = triviaForm._slug || slugify(triviaForm.q);
      const path = 'content/trivia/' + slug + '.md';
      const content = buildTriviaMd({...triviaForm, opts, ans: parseInt(triviaForm.ans)||0});
      let sha = null;
      try {
        const existing = await getFile(path);
        if (existing) sha = existing.sha;
      } catch (e) {}
      await putFile(path, content, sha, 'Update trivia: ' + triviaForm.q);
      toast('Trivia question saved! Site will rebuild in ~1 min.');
      setEditingTrivia(null);
    } catch (e) {
      toast('Error: ' + e.message);
    }
    setSaving(false);
  }

  // Memory verse edit
  function startEditVerse(v) {
    setEditingVerse(v || {});
    setVerseForm({
      ref: v ? v.ref : '', text: v ? v.text : '',
      difficulty: v ? v.difficulty : 'easy', order: v ? (v.order || 0) : 0,
      _slug: v ? v._slug : ''
    });
  }

  async function saveVerse() {
    setSaving(true);
    try {
      const slug = verseForm._slug || slugify(verseForm.ref);
      const path = 'content/memory-verse/' + slug + '.md';
      const content = buildMemoryVerseMd(verseForm);
      let sha = null;
      try {
        const existing = await getFile(path);
        if (existing) sha = existing.sha;
      } catch (e) {}
      await putFile(path, content, sha, 'Update memory verse: ' + verseForm.ref);
      toast('Memory verse saved! Site will rebuild in ~1 min.');
      setEditingVerse(null);
    } catch (e) {
      toast('Error: ' + e.message);
    }
    setSaving(false);
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  // Trivia editor
  if (editingTrivia !== null) {
    return (
      <div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditingTrivia(null)} style={{marginBottom:16}}>
          <Icons.Back /> Back
        </button>
        <div className="card">
          <div className="form-group">
            <label className="form-label">Question</label>
            <input className="form-input" value={triviaForm.q || ''} onChange={e => setTriviaForm({...triviaForm, q: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Options (one per line)</label>
            <textarea className="form-textarea" value={triviaForm.opts || ''} onChange={e => setTriviaForm({...triviaForm, opts: e.target.value})} placeholder={"Option 1\nOption 2\nOption 3\nOption 4"} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div className="form-group">
              <label className="form-label">Correct Answer Index (0-based)</label>
              <input type="number" className="form-input" value={triviaForm.ans || 0} onChange={e => setTriviaForm({...triviaForm, ans: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Order</label>
              <input type="number" className="form-input" value={triviaForm.order || 0} onChange={e => setTriviaForm({...triviaForm, order: parseInt(e.target.value)||0})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Bible Reference</label>
            <input className="form-input" value={triviaForm.ref || ''} onChange={e => setTriviaForm({...triviaForm, ref: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Explanation</label>
            <textarea className="form-textarea" value={triviaForm.explain || ''} onChange={e => setTriviaForm({...triviaForm, explain: e.target.value})} />
          </div>
          <button className="btn btn-gold" onClick={saveTrivia} disabled={saving} style={{marginTop:12}}>
            <Icons.Save /> {saving ? 'Saving...' : 'Save Trivia'}
          </button>
        </div>
      </div>
    );
  }

  // Memory verse editor
  if (editingVerse !== null) {
    return (
      <div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditingVerse(null)} style={{marginBottom:16}}>
          <Icons.Back /> Back
        </button>
        <div className="card">
          <div className="form-group">
            <label className="form-label">Reference</label>
            <input className="form-input" value={verseForm.ref || ''} onChange={e => setVerseForm({...verseForm, ref: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Verse Text</label>
            <textarea className="form-textarea" value={verseForm.text || ''} onChange={e => setVerseForm({...verseForm, text: e.target.value})} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-select" value={verseForm.difficulty || 'easy'} onChange={e => setVerseForm({...verseForm, difficulty: e.target.value})}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Order</label>
              <input type="number" className="form-input" value={verseForm.order || 0} onChange={e => setVerseForm({...verseForm, order: parseInt(e.target.value)||0})} />
            </div>
          </div>
          <button className="btn btn-gold" onClick={saveVerse} disabled={saving} style={{marginTop:12}}>
            <Icons.Save /> {saving ? 'Saving...' : 'Save Verse'}
          </button>
        </div>
      </div>
    );
  }

  const gameToggles = [
    { key: 'trivia', label: 'Bible Trivia' },
    { key: 'memory_verse', label: 'Memory Verse Challenge' },
    { key: 'crossword', label: 'Crossword Puzzle' },
    { key: 'word_scramble', label: 'Word Scramble' },
    { key: 'who_am_i', label: 'Who Am I?' },
    { key: 'fill_blank', label: 'Fill in the Blank' },
    { key: 'word_search', label: 'Word Search' },
  ];

  return (
    <div>
      <div className="card">
        <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',marginBottom:16,color:'var(--gold)'}}>
          Active Games
        </h3>
        {gameToggles.map(g => (
          <div className="toggle-row" key={g.key}>
            <span className="toggle-label">{g.label}</span>
            <div className={'toggle' + (games[g.key] ? ' on' : '')} onClick={() => toggleGame(g.key)}></div>
          </div>
        ))}
        <button className="btn btn-gold btn-sm" onClick={saveToggles} disabled={saving} style={{marginTop:16}}>
          <Icons.Save /> {saving ? 'Saving...' : 'Save Toggles'}
        </button>
      </div>

      <div className="card" style={{marginTop:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',color:'var(--gold)'}}>
            Trivia Questions ({trivia.length})
          </h3>
          <button className="btn btn-gold btn-sm" onClick={() => startEditTrivia(null)}>
            <Icons.Plus /> Add
          </button>
        </div>
        {trivia.map((t, i) => (
          <div className="list-item" key={i} onClick={() => startEditTrivia(t)}>
            <div>
              <div className="list-item-title">{t.q}</div>
              <div className="list-item-sub">{t.ref}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginTop:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',color:'var(--gold)'}}>
            Memory Verses ({memoryVerses.length})
          </h3>
          <button className="btn btn-gold btn-sm" onClick={() => startEditVerse(null)}>
            <Icons.Plus /> Add
          </button>
        </div>
        {memoryVerses.map((v, i) => (
          <div className="list-item" key={i} onClick={() => startEditVerse(v)}>
            <div>
              <div className="list-item-title">{v.ref}</div>
              <div className="list-item-sub">{v.difficulty}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Admin Console ──────────────────────────────────────────
function AdminConsole() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMsg, showToast] = useToast();
  const { data: cmsData, loading: cmsLoading } = useCmsData();

  const panels = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'scripture', label: 'Scripture', icon: Icons.Scripture },
    { id: 'inspiration', label: 'Inspiration', icon: Icons.Inspiration },
    { id: 'blog', label: 'Blog', icon: Icons.Blog },
    { id: 'prayer', label: 'Prayer', icon: Icons.Prayer },
    { id: 'hero', label: 'Hero Section', icon: Icons.Hero },
    { id: 'about', label: 'About', icon: Icons.About },
    { id: 'games', label: 'Games', icon: Icons.Games },
  ];

  function navigate(id) {
    setActivePanel(id);
    setSidebarOpen(false);
  }

  function renderPanel() {
    if (cmsLoading && activePanel === 'dashboard') {
      return <div className="loading"><div className="spinner"></div><p>Loading...</p></div>;
    }
    switch (activePanel) {
      case 'dashboard': return <DashboardPanel cmsData={cmsData} />;
      case 'scripture': return <ScripturePanel toast={showToast} />;
      case 'inspiration': return <InspirationPanel toast={showToast} />;
      case 'blog': return <BlogPanel toast={showToast} />;
      case 'prayer': return <PrayerPanel toast={showToast} />;
      case 'hero': return <HeroPanel toast={showToast} />;
      case 'about': return <AboutPanel toast={showToast} />;
      case 'games': return <GamesPanel toast={showToast} />;
      default: return <DashboardPanel cmsData={cmsData} />;
    }
  }

  const currentPanel = panels.find(p => p.id === activePanel);

  return (
    <div>
      <style>{css}</style>
      <div className="admin-wrap">
        <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <Icons.Close /> : <Icons.Menu />}
        </button>

        <aside className={'sidebar' + (sidebarOpen ? ' open' : '')}>
          <div className="sidebar-brand">Heartbeat Ministries</div>
          <nav className="sidebar-nav">
            {panels.map(p => (
              <button key={p.id}
                className={'nav-item' + (activePanel === p.id ? ' active' : '')}
                onClick={() => navigate(p.id)}>
                <p.icon /> {p.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div style={{marginBottom:8}}>{getUserEmail()}</div>
            <button onClick={logout}><Icons.Logout /> Sign out</button>
          </div>
        </aside>

        <main className="main">
          <div className="main-header">
            <h1>{currentPanel ? currentPanel.label : 'Dashboard'}</h1>
          </div>
          {renderPanel()}
        </main>
      </div>
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}

// ─── Mount function (called from index.html) ─────────────────────
export function mount(container) {
  const root = ReactDOM.createRoot(container);
  root.render(<AdminConsole />);
}
