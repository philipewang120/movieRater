import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getToken } from "../../api";
import {
  Box, Button, Stack, Typography, TextField,
  CircularProgress, Avatar, Tabs, Tab,
} from "@mui/material";
import {
  Movie, ArrowBack, CheckCircle, Cancel, Delete,
  People, Public, Pending, Done, Close,
  Edit, Visibility,
} from "@mui/icons-material";

function useFonts() {
  useEffect(() => {
    const id = "gfonts-cinemalist";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id; link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap";
    document.head.appendChild(link);
  }, []);
}

const STYLES = `
  :root {
    --ink: #0f0f12; --surface: #16161c; --card: #1e1e27; --raised: #26262f;
    --accent: #e8c547; --accent2: #5de8c5; --muted: #6b6b7a;
    --border: rgba(255,255,255,0.07); --radius-lg: 18px; --radius-md: 12px;
    --font-display: 'Bebas Neue', sans-serif; --font-body: 'DM Sans', sans-serif;
    --transition: 0.22s cubic-bezier(0.4,0,0.2,1);
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--ink); font-family: var(--font-body); color: #e0e0e8; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--raised); border-radius: 4px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.45s ease both; }

  /* NAV */
  .adm-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 68px;
    background: var(--surface); border-bottom: 1px solid var(--border);
    box-shadow: 0 1px 24px rgba(0,0,0,0.5); gap: 16px;
  }
  @media (max-width: 600px) { .adm-nav { padding: 0 20px; } }

  .adm-logo {
    font-family: var(--font-display); font-size: 24px; letter-spacing: 2px;
    color: var(--accent); display: flex; align-items: center; gap: 8px; cursor: pointer;
  }
  .adm-logo-icon {
    width: 34px; height: 34px; background: var(--accent); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; color: var(--ink);
  }
  .adm-badge {
    background: rgba(255,107,107,0.12); border: 1px solid rgba(255,107,107,0.2);
    color: #ff6b6b; font-family: var(--font-display); font-size: 12px;
    letter-spacing: 2px; padding: 3px 10px; border-radius: 20px;
  }
  .adm-back-btn {
    background: var(--raised) !important; color: var(--muted) !important;
    border: 1px solid var(--border) !important; border-radius: 10px !important;
    text-transform: none !important; font-family: var(--font-body) !important;
    font-size: 13px !important; padding: 6px 14px !important;
    transition: all var(--transition) !important;
  }
  .adm-back-btn:hover {
    background: #2e2e3a !important; color: #e0e0e8 !important;
    border-color: rgba(255,255,255,0.18) !important;
  }

  /* PAGE */
  .adm-page { min-height: 100vh; background: var(--ink); }
  .adm-body { max-width: 1100px; margin: 0 auto; padding: 40px 32px 80px; }
  @media (max-width: 600px) { .adm-body { padding: 24px 16px 64px; } }

  /* STATS GRID */
  .adm-stats {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
    margin-bottom: 40px;
  }
  @media (max-width: 600px) { .adm-stats { grid-template-columns: repeat(2, 1fr); } }

  .adm-stat-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-md); padding: 20px 22px;
    transition: border-color var(--transition);
  }
  .adm-stat-card:hover { border-color: rgba(255,255,255,0.12); }
  .adm-stat-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 12px;
  }
  .adm-stat-num {
    font-family: var(--font-display); font-size: 32px; color: #f0f0f5; letter-spacing: 1px;
  }
  .adm-stat-label { font-size: 12px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }

  /* TABS */
  .adm-tabs-wrap {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-lg); margin-bottom: 24px; overflow: hidden;
  }

  /* SUBMISSION CARD */
  .adm-sub-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-md); padding: 20px; margin-bottom: 16px;
    transition: border-color var(--transition);
  }
  .adm-sub-card:hover { border-color: rgba(255,255,255,0.1); }

  .adm-sub-header {
    display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px;
  }
  .adm-sub-poster {
    width: 60px; height: 86px; object-fit: cover;
    border-radius: 8px; flex-shrink: 0; background: var(--raised);
    display: flex; align-items: center; justify-content: center;
  }
  .adm-sub-info { flex: 1; min-width: 0; }
  .adm-sub-title { font-size: 16px; font-weight: 600; color: #f0f0f5; margin-bottom: 4px; }
  .adm-sub-meta { font-size: 12px; color: var(--muted); line-height: 1.6; }
  .adm-sub-meta span { color: #e0e0e8; }

  .adm-submitter {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; background: var(--raised); border-radius: 8px;
    margin-bottom: 12px; font-size: 13px;
  }
  .adm-submitter-name { color: var(--accent); font-weight: 600; }
  .adm-submitter-count { color: var(--muted); }

  .adm-synopsis {
    font-size: 13px; color: var(--muted); line-height: 1.6;
    padding: 12px 14px; background: var(--raised); border-radius: 8px;
    margin-bottom: 16px;
  }

  .adm-sub-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

  .adm-approve-btn {
    background: rgba(93,232,197,0.12) !important; color: var(--accent2) !important;
    border: 1px solid rgba(93,232,197,0.3) !important; border-radius: 10px !important;
    text-transform: none !important; font-family: var(--font-body) !important;
    font-size: 13px !important; font-weight: 600 !important; padding: 7px 18px !important;
    transition: all var(--transition) !important;
  }
  .adm-approve-btn:hover {
    background: rgba(93,232,197,0.2) !important;
    border-color: rgba(93,232,197,0.5) !important;
  }
  .adm-approve-btn:disabled { opacity: 0.5 !important; }

  .adm-reject-btn {
    background: rgba(255,107,107,0.08) !important; color: #ff6b6b !important;
    border: 1px solid rgba(255,107,107,0.2) !important; border-radius: 10px !important;
    text-transform: none !important; font-family: var(--font-body) !important;
    font-size: 13px !important; padding: 7px 18px !important;
    transition: all var(--transition) !important;
  }
  .adm-reject-btn:hover {
    background: rgba(255,107,107,0.15) !important;
    border-color: rgba(255,107,107,0.4) !important;
  }
  .adm-reject-btn:disabled { opacity: 0.5 !important; }

  .adm-delete-btn {
    background: transparent !important; color: var(--muted) !important;
    border: 1px solid var(--border) !important; border-radius: 10px !important;
    text-transform: none !important; font-family: var(--font-body) !important;
    font-size: 13px !important; padding: 7px 14px !important;
    transition: all var(--transition) !important; margin-left: auto !important;
  }
  .adm-delete-btn:hover {
    color: #ff6b6b !important; border-color: rgba(255,107,107,0.3) !important;
  }

  /* NOTES INPUT */
  .adm-notes-wrap { margin-top: 12px; }
  .adm-notes-field .MuiInputBase-input {
    color: #e0e0e8 !important; font-family: var(--font-body) !important; font-size: 13px !important;
  }
  .adm-notes-field .MuiInputLabel-root { color: var(--muted) !important; font-family: var(--font-body) !important; font-size: 13px !important; }
  .adm-notes-field .MuiInputLabel-root.Mui-focused { color: var(--accent2) !important; }
  .adm-notes-field .MuiOutlinedInput-root fieldset { border-color: var(--border) !important; border-radius: 10px !important; }
  .adm-notes-field .MuiOutlinedInput-root.Mui-focused fieldset { border-color: var(--accent2) !important; }

  /* STATUS BADGE */
  .adm-status-badge {
    font-size: 10px; font-weight: 700; letter-spacing: 1px;
    padding: 3px 10px; border-radius: 20px; text-transform: uppercase;
  }
  .badge-pending  { background: rgba(232,197,71,0.12);  color: var(--accent);  border: 1px solid rgba(232,197,71,0.2); }
  .badge-approved { background: rgba(93,232,197,0.12);  color: var(--accent2); border: 1px solid rgba(93,232,197,0.2); }
  .badge-rejected { background: rgba(255,107,107,0.12); color: #ff6b6b;        border: 1px solid rgba(255,107,107,0.2); }

  /* MOVIE ROW */
  .adm-movie-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 16px; background: var(--card);
    border: 1px solid var(--border); border-radius: var(--radius-md);
    margin-bottom: 10px; transition: border-color var(--transition);
  }
  .adm-movie-row:hover { border-color: rgba(255,255,255,0.1); }

  /* EMPTY */
  .adm-empty {
    text-align: center; padding: 48px 24px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }

  /* FORBIDDEN */
  .adm-forbidden {
    min-height: 60vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px; text-align: center;
    padding: 24px;
  }

  /* PAGINATION */
  .adm-pagination {
    display: flex; justify-content: center; gap: 10px; margin-top: 24px;
  }
  .adm-page-btn {
    background: var(--card) !important; border: 1px solid var(--border) !important;
    color: #e0e0e8 !important; border-radius: 10px !important;
    text-transform: none !important; font-family: var(--font-body) !important;
    font-size: 13px !important; padding: 6px 16px !important;
    transition: all var(--transition) !important;
  }
  .adm-page-btn:hover { background: var(--raised) !important; }
  .adm-page-btn.active {
    background: rgba(232,197,71,0.12) !important;
    border-color: rgba(232,197,71,0.3) !important;
    color: var(--accent) !important;
  }
  .adm-page-btn:disabled { opacity: 0.4 !important; }
`;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const COUNTRY_NAMES = {
  NG: "Nigeria", CM: "Cameroon", ZA: "South Africa",
  GH: "Ghana", EG: "Egypt", KE: "Kenya", MA: "Morocco",
  TN: "Tunisia", SN: "Senegal", CI: "Ivory Coast",
};

// ── SUBMISSION CARD ───────────────────────────────────────
function SubmissionCard({ sub, onApprove, onReject, onDelete, processing }) {
  const [notes,      setNotes]      = useState("");
  const [showNotes,  setShowNotes]  = useState(false);
  const [action,     setAction]     = useState(null); // 'approve' | 'reject'

  function handleAction(type) {
    setAction(type);
    setShowNotes(true);
  }

  function handleConfirm() {
    if (action === "approve") onApprove(sub.id, notes);
    else onReject(sub.id, notes);
    setShowNotes(false);
    setNotes("");
    setAction(null);
  }

  return (
    <div className="adm-sub-card fade-up">
      <div className="adm-sub-header">
        {sub.poster_url ? (
          <img src={sub.poster_url} alt={sub.title} className="adm-sub-poster" />
        ) : (
          <div className="adm-sub-poster">
            <Movie sx={{ fontSize: 20, color: "var(--muted)" }} />
          </div>
        )}
        <div className="adm-sub-info">
          <div className="adm-sub-title">{sub.title}</div>
          <div className="adm-sub-meta">
            <span>{COUNTRY_NAMES[sub.origin_country] || sub.origin_country}</span>
            {sub.release_year && <> · <span>{sub.release_year}</span></>}
            {sub.director && <> · Dir. <span>{sub.director}</span></>}
            {sub.runtime && <> · <span>{sub.runtime} min</span></>}
            {sub.original_language && <> · <span>{sub.original_language.toUpperCase()}</span></>}
          </div>
          {sub.genres?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {sub.genres.map(g => (
                <span key={g} style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 20,
                  background: "var(--raised)", color: "var(--muted)",
                  border: "1px solid var(--border)"
                }}>{g}</span>
              ))}
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
            Submitted {timeAgo(sub.created_at)}
          </div>
        </div>
        <span className={`adm-status-badge badge-${sub.status}`}>{sub.status}</span>
      </div>

      {/* Submitter info */}
      <div className="adm-submitter">
        <Avatar
          src={sub.submitter_pic}
          sx={{ width: 28, height: 28, fontSize: 12, background: "var(--card)", fontFamily: "var(--font-display)" }}
        >
          {!sub.submitter_pic && sub.submitter_username?.charAt(0).toUpperCase()}
        </Avatar>
        <span>Submitted by</span>
        <span className="adm-submitter-name">@{sub.submitter_username}</span>
        <span className="adm-submitter-count">· {sub.submitter_movie_count} movies in list</span>
      </div>

      {/* Synopsis */}
      {sub.synopsis && (
        <div className="adm-synopsis">{sub.synopsis}</div>
      )}

      {/* Streaming links */}
      {sub.streaming_links?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {sub.streaming_links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: "var(--accent2)", marginRight: 12, textDecoration: "none" }}>
              {l.platform} ↗
            </a>
          ))}
        </div>
      )}

      {/* Trailer */}
      {sub.trailer_url && (
        <div style={{ marginBottom: 12 }}>
          <a href={sub.trailer_url} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
            🎬 Watch Trailer ↗
          </a>
        </div>
      )}

      {/* Actions — only for pending */}
      {sub.status === "pending" && (
        <>
          <div className="adm-sub-actions">
            <Button
              className="adm-approve-btn"
              startIcon={<CheckCircle sx={{ fontSize: 16 }} />}
              onClick={() => handleAction("approve")}
              disabled={!!processing}
            >
              Approve
            </Button>
            <Button
              className="adm-reject-btn"
              startIcon={<Cancel sx={{ fontSize: 16 }} />}
              onClick={() => handleAction("reject")}
              disabled={!!processing}
            >
              Reject
            </Button>
            <Button
              className="adm-delete-btn"
              startIcon={<Delete sx={{ fontSize: 14 }} />}
              onClick={() => onDelete(sub.id)}
              disabled={!!processing}
            >
              Delete
            </Button>
          </div>

          {showNotes && (
            <div className="adm-notes-wrap">
              <TextField
                className="adm-notes-field"
                label={`Notes for ${action === "approve" ? "approval" : "rejection"} (optional)`}
                fullWidth multiline rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={action === "reject" ? "Explain why this was rejected…" : "Any notes for the submitter…"}
                sx={{ mb: 1.5 }}
              />
              <Stack direction="row" spacing={1}>
                <Button
                  onClick={handleConfirm}
                  disabled={!!processing}
                  sx={{
                    background: action === "approve" ? "var(--accent2)" : "#ff6b6b",
                    color: "var(--ink)", borderRadius: "10px",
                    textTransform: "none", fontFamily: "var(--font-body)",
                    fontWeight: 700, fontSize: 13, padding: "6px 18px",
                    "&:hover": { opacity: 0.85 },
                  }}
                >
                  {processing === sub.id
                    ? <CircularProgress size={14} sx={{ color: "var(--ink)" }} />
                    : `Confirm ${action}`
                  }
                </Button>
                <Button
                  onClick={() => { setShowNotes(false); setNotes(""); setAction(null); }}
                  sx={{
                    background: "var(--raised)", color: "var(--muted)",
                    borderRadius: "10px", textTransform: "none",
                    fontFamily: "var(--font-body)", fontSize: 13,
                    border: "1px solid var(--border)", padding: "6px 14px",
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </div>
          )}
        </>
      )}

      {/* Show admin notes on reviewed submissions */}
      {sub.status !== "pending" && sub.admin_notes && (
        <div style={{
          fontSize: 12, color: "var(--muted)", padding: "8px 12px",
          background: "var(--raised)", borderRadius: 8, marginTop: 8, fontStyle: "italic"
        }}>
          Admin note: {sub.admin_notes}
        </div>
      )}
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────
function AdminDashboard() {
  useFonts();
  const navigate = useNavigate();

  const [authorized,   setAuthorized]   = useState(null);
  const [stats,        setStats]        = useState(null);
  const [counts,       setCounts]       = useState({ pending: 0, approved: 0, rejected: 0 });
  const [submissions,  setSubmissions]  = useState([]);
  const [movies,       setMovies]       = useState([]);
  const [activeTab,    setActiveTab]    = useState(0);
  const [subFilter,    setSubFilter]    = useState("pending");
  const [loading,      setLoading]      = useState(true);
  const [processing,   setProcessing]   = useState(null);
  const [page,         setPage]         = useState(0);
  const [total,        setTotal]        = useState(0);

  const token = getToken();

  // Auth + admin check
  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      if (!payload.role || !["admin", "superadmin"].includes(payload.role)) {
        setAuthorized(false);
        return;
      }
      setAuthorized(true);
      loadStats();
      loadCounts();
    } catch { navigate("/login"); }
  }, []);

  useEffect(() => {
    if (authorized) {
      if (activeTab === 0) loadSubmissions(subFilter, 0);
      if (activeTab === 1) loadMovies(0);
    }
  }, [authorized, activeTab, subFilter]);

  async function loadStats() {
    try {
      const res = await apiFetch("/admin/stats");
      const data = await res?.json();
      if (data) setStats(data);
    } catch {}
  }

  async function loadCounts() {
    try {
      const res = await apiFetch("/admin/submissions/counts");
      const data = await res?.json();
      if (data) setCounts(data);
    } catch {}
  }

  async function loadSubmissions(status, pageNum) {
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/submissions?status=${status}&page=${pageNum}`);
      const data = await res?.json();
      setSubmissions(data?.submissions || []);
      setTotal(data?.total || 0);
      setPage(pageNum);
    } catch { setSubmissions([]); }
    finally { setLoading(false); }
  }

  async function loadMovies(pageNum) {
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/african-movies?page=${pageNum}`);
      const data = await res?.json();
      setMovies(data?.movies || []);
      setTotal(data?.total || 0);
      setPage(pageNum);
    } catch { setMovies([]); }
    finally { setLoading(false); }
  }

  async function handleApprove(id, notes) {
    setProcessing(id);
    try {
      const res = await apiFetch(`/admin/submissions/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ admin_notes: notes }),
      });
      if (res?.ok) {
        setSubmissions(p => p.filter(s => s.id !== id));
        setCounts(p => ({ ...p, pending: p.pending - 1, approved: p.approved + 1 }));
        loadStats();
      }
    } catch {} finally { setProcessing(null); }
  }

  async function handleReject(id, notes) {
    setProcessing(id);
    try {
      const res = await apiFetch(`/admin/submissions/${id}/reject`, {
        method: "PUT",
        body: JSON.stringify({ admin_notes: notes }),
      });
      if (res?.ok) {
        setSubmissions(p => p.filter(s => s.id !== id));
        setCounts(p => ({ ...p, pending: p.pending - 1, rejected: p.rejected + 1 }));
      }
    } catch {} finally { setProcessing(null); }
  }

  async function handleDeleteSubmission(id) {
    if (!window.confirm("Delete this submission permanently?")) return;
    try {
      await apiFetch(`/admin/submissions/${id}`, { method: "DELETE" });
      setSubmissions(p => p.filter(s => s.id !== id));
      setTotal(t => t - 1);
    } catch {}
  }

  async function handleDeleteMovie(id) {
    if (!window.confirm("Remove this movie from the African Cinema database?")) return;
    try {
      await apiFetch(`/admin/african-movies/${id}`, { method: "DELETE" });
      setMovies(p => p.filter(m => m.id !== id));
      setTotal(t => t - 1);
      loadStats();
    } catch {}
  }

  // Forbidden
  if (authorized === false) return (
    <>
      <style>{STYLES}</style>
      <div className="adm-page">
        <div className="adm-forbidden">
          <Cancel sx={{ fontSize: 64, color: "#ff6b6b", opacity: 0.5 }} />
          <Typography sx={{ fontFamily: "var(--font-display)", fontSize: 32, letterSpacing: 2, color: "#f0f0f5" }}>
            ACCESS DENIED
          </Typography>
          <Typography sx={{ fontSize: 14, color: "var(--muted)" }}>
            You don't have permission to view this page.
          </Typography>
          <Button
            onClick={() => navigate("/home")}
            sx={{ background: "var(--raised)", color: "#e0e0e8", borderRadius: "10px", textTransform: "none", fontFamily: "var(--font-body)", border: "1px solid var(--border)", mt: 2, px: 3 }}
          >
            Go home
          </Button>
        </div>
      </div>
    </>
  );

  if (authorized === null) return (
    <>
      <style>{STYLES}</style>
      <div className="adm-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: "var(--accent)" }} />
      </div>
    </>
  );

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <style>{STYLES}</style>
      <div className="adm-page">

        {/* NAV */}
        <nav className="adm-nav">
          <div className="adm-logo" onClick={() => navigate("/home")}>
            <div className="adm-logo-icon"><Movie sx={{ fontSize: 18 }} /></div>
            MOVIE RATER
          </div>
          <span className="adm-badge">ADMIN DASHBOARD</span>
          <Button
            className="adm-back-btn"
            startIcon={<ArrowBack sx={{ fontSize: 15 }} />}
            onClick={() => navigate("/home")}
          >
            Back to Home
          </Button>
        </nav>

        <div className="adm-body">

          {/* Stats */}
          {stats && (
            <div className="adm-stats fade-up">
              <div className="adm-stat-card">
                <div className="adm-stat-icon" style={{ background: "rgba(93,232,197,0.1)" }}>
                  <Public sx={{ fontSize: 20, color: "var(--accent2)" }} />
                </div>
                <div className="adm-stat-num">{stats.totalMovies}</div>
                <div className="adm-stat-label">African Movies</div>
              </div>
              <div className="adm-stat-card">
                <div className="adm-stat-icon" style={{ background: "rgba(232,197,71,0.1)" }}>
                  <Pending sx={{ fontSize: 20, color: "var(--accent)" }} />
                </div>
                <div className="adm-stat-num" style={{ color: counts.pending > 0 ? "var(--accent)" : "#f0f0f5" }}>
                  {counts.pending}
                </div>
                <div className="adm-stat-label">Pending Review</div>
              </div>
              <div className="adm-stat-card">
                <div className="adm-stat-icon" style={{ background: "rgba(93,232,197,0.1)" }}>
                  <Done sx={{ fontSize: 20, color: "var(--accent2)" }} />
                </div>
                <div className="adm-stat-num">{stats.communityMovies}</div>
                <div className="adm-stat-label">Community Films</div>
              </div>
              <div className="adm-stat-card">
                <div className="adm-stat-icon" style={{ background: "rgba(255,107,107,0.1)" }}>
                  <Cancel sx={{ fontSize: 20, color: "#ff6b6b" }} />
                </div>
                <div className="adm-stat-num">{counts.rejected}</div>
                <div className="adm-stat-label">Rejected</div>
              </div>
              <div className="adm-stat-card">
                <div className="adm-stat-icon" style={{ background: "rgba(232,197,71,0.1)" }}>
                  <People sx={{ fontSize: 20, color: "var(--accent)" }} />
                </div>
                <div className="adm-stat-num">{stats.totalUsers}</div>
                <div className="adm-stat-label">Total Users</div>
              </div>
              <div className="adm-stat-card">
                <div className="adm-stat-icon" style={{ background: "rgba(93,232,197,0.1)" }}>
                  <Movie sx={{ fontSize: 20, color: "var(--accent2)" }} />
                </div>
                <div className="adm-stat-num">{stats.totalSubmissions}</div>
                <div className="adm-stat-label">All Submissions</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="adm-tabs-wrap fade-up">
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                "& .MuiTab-root": {
                  color: "var(--muted)", fontFamily: "var(--font-body)",
                  fontSize: 13, textTransform: "none", fontWeight: 500,
                },
                "& .Mui-selected": { color: "var(--accent) !important" },
                "& .MuiTabs-indicator": { background: "var(--accent)" },
              }}
            >
              <Tab label={`Submissions ${counts.pending > 0 ? `(${counts.pending} pending)` : ""}`} />
              <Tab label="African Movies Database" />
            </Tabs>
          </div>

          {/* ── SUBMISSIONS TAB ── */}
          {activeTab === 0 && (
            <>
              {/* Status filter */}
              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {["pending", "approved", "rejected"].map(s => (
                  <button
                    key={s}
                    onClick={() => { setSubFilter(s); loadSubmissions(s, 0); }}
                    style={{
                      background: subFilter === s ? "rgba(232,197,71,0.12)" : "var(--card)",
                      border: `1px solid ${subFilter === s ? "rgba(232,197,71,0.3)" : "var(--border)"}`,
                      color: subFilter === s ? "var(--accent)" : "var(--muted)",
                      borderRadius: "10px", padding: "6px 16px",
                      fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer",
                      transition: "all 0.2s", textTransform: "capitalize",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    {s} <span style={{
                      background: "var(--raised)", borderRadius: "20px",
                      padding: "1px 8px", fontSize: 11,
                    }}>{counts[s]}</span>
                  </button>
                ))}
              </div>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress sx={{ color: "var(--accent)" }} />
                </Box>
              ) : submissions.length === 0 ? (
                <div className="adm-empty">
                  <Typography sx={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: 2, color: "var(--muted)" }}>
                    NO {subFilter.toUpperCase()} SUBMISSIONS
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "var(--muted)", mt: 1 }}>
                    {subFilter === "pending" ? "You're all caught up!" : `No ${subFilter} submissions yet`}
                  </Typography>
                </div>
              ) : (
                <>
                  {submissions.map(sub => (
                    <SubmissionCard
                      key={sub.id}
                      sub={sub}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onDelete={handleDeleteSubmission}
                      processing={processing}
                    />
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="adm-pagination">
                      <Button className="adm-page-btn" disabled={page === 0}
                        onClick={() => loadSubmissions(subFilter, page - 1)}>← Prev</Button>
                      <Button className={`adm-page-btn active`}>
                        {page + 1} / {totalPages}
                      </Button>
                      <Button className="adm-page-btn" disabled={page >= totalPages - 1}
                        onClick={() => loadSubmissions(subFilter, page + 1)}>Next →</Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── MOVIES DATABASE TAB ── */}
          {activeTab === 1 && (
            <>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress sx={{ color: "var(--accent)" }} />
                </Box>
              ) : movies.length === 0 ? (
                <div className="adm-empty">
                  <Typography sx={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: 2, color: "var(--muted)" }}>
                    NO MOVIES YET
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "var(--muted)", mt: 1 }}>
                    Approve submissions to add movies here
                  </Typography>
                </div>
              ) : (
                <>
                  <Typography sx={{ fontSize: 13, color: "var(--muted)", mb: 2, fontFamily: "var(--font-body)" }}>
                    {total} movies in database
                  </Typography>
                  {movies.map(m => (
                    <div key={m.id} className="adm-movie-row fade-up">
                      {m.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                          style={{ width: 36, height: 52, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                          alt={m.title} />
                      ) : (
                        <div style={{ width: 36, height: 52, background: "var(--raised)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Movie sx={{ fontSize: 16, color: "var(--muted)" }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                          {COUNTRY_NAMES[m.origin_country] || m.origin_country} · {m.release_year}
                          {m.tmdb_rating && ` · ⭐ ${m.tmdb_rating}`}
                        </div>
                      </div>
                      <span className={`adm-status-badge badge-${m.source === "community" ? "approved" : "pending"}`}>
                        {m.source}
                      </span>
                      <Button
                        onClick={() => handleDeleteMovie(m.id)}
                        sx={{
                          background: "none", color: "var(--muted)", minWidth: "unset",
                          borderRadius: "8px", padding: "6px",
                          "&:hover": { color: "#ff6b6b", background: "rgba(255,107,107,0.08)" },
                        }}
                      >
                        <Delete sx={{ fontSize: 18 }} />
                      </Button>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="adm-pagination">
                      <Button className="adm-page-btn" disabled={page === 0}
                        onClick={() => loadMovies(page - 1)}>← Prev</Button>
                      <Button className="adm-page-btn active">
                        {page + 1} / {totalPages}
                      </Button>
                      <Button className="adm-page-btn" disabled={page >= totalPages - 1}
                        onClick={() => loadMovies(page + 1)}>Next →</Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}

export default AdminDashboard;