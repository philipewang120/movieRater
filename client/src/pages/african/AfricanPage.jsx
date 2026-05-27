import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getToken } from "../../api";
import {
  Box, Button, Stack, Typography, Avatar, Tooltip, CircularProgress,
} from "@mui/material";
import {
  Movie, Star, TrendingUp, NewReleases, Public,
  ArrowBack, Add, ChevronLeft, ChevronRight, Refresh,
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

  /* ── NAV ── */
  .af-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 68px;
    background: var(--surface); border-bottom: 1px solid var(--border);
    box-shadow: 0 1px 24px rgba(0,0,0,0.5);
    gap: 16px;
  }
  @media (max-width: 600px) { .af-nav { padding: 0 20px; } }

  .af-logo {
    font-family: var(--font-display); font-size: 26px; letter-spacing: 2px;
    color: var(--accent); display: flex; align-items: center; gap: 8px;
    cursor: pointer; transition: opacity var(--transition); flex-shrink: 0;
  }
  .af-logo:hover { opacity: 0.8; }
  .af-logo-icon {
    width: 34px; height: 34px; background: var(--accent); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; color: var(--ink);
  }

  .af-nav-badge {
    background: rgba(232,197,71,0.12); border: 1px solid rgba(232,197,71,0.2);
    color: var(--accent); font-family: var(--font-display); font-size: 13px;
    letter-spacing: 2px; padding: 4px 12px; border-radius: 20px;
  }

  .af-nav-btn {
    background: var(--raised) !important; color: var(--muted) !important;
    border: 1px solid var(--border) !important; border-radius: 10px !important;
    text-transform: none !important; font-family: var(--font-body) !important;
    font-size: 13px !important; padding: 6px 14px !important;
    transition: all var(--transition) !important; flex-shrink: 0;
  }
  .af-nav-btn:hover {
    background: #2e2e3a !important; color: #e0e0e8 !important;
    border-color: rgba(255,255,255,0.18) !important;
  }

  /* ── HERO ── */
  .af-hero {
    position: relative; height: 480px; overflow: hidden;
    display: flex; align-items: flex-end;
  }
  @media (max-width: 600px) { .af-hero { height: 320px; } }

  .af-hero-bg {
    position: absolute; inset: 0;
    background-size: cover; background-position: center;
    transition: opacity 0.8s ease;
  }
  .af-hero-bg::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(15,15,18,0.2) 0%,
      rgba(15,15,18,0.6) 50%,
      rgba(15,15,18,0.95) 100%
    );
  }
  .af-hero-fallback {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, #1a1a24 0%, #0f0f12 50%, #1a1824 100%);
    display: flex; align-items: center; justify-content: center;
  }

  .af-hero-content {
    position: relative; z-index: 2;
    padding: 40px 48px; width: 100%;
  }
  @media (max-width: 600px) { .af-hero-content { padding: 24px 20px; } }

  .af-hero-eyebrow {
    font-family: var(--font-display); font-size: 12px; letter-spacing: 4px;
    color: var(--accent2); margin-bottom: 8px;
  }
  .af-hero-title {
    font-family: var(--font-display) !important;
    font-size: clamp(28px, 5vw, 52px) !important;
    letter-spacing: 2px !important; color: #f0f0f5 !important;
    line-height: 1.1 !important; margin-bottom: 8px !important;
    max-width: 600px;
  }
  .af-hero-meta {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 20px; flex-wrap: wrap;
  }
  .af-hero-chip {
    font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
  }
  .af-hero-chip-rating {
    background: rgba(232,197,71,0.15); color: var(--accent);
    border: 1px solid rgba(232,197,71,0.3);
  }
  .af-hero-chip-country {
    background: rgba(93,232,197,0.12); color: var(--accent2);
    border: 1px solid rgba(93,232,197,0.2);
  }
  .af-hero-add-btn {
    background: var(--accent) !important; color: var(--ink) !important;
    border-radius: 10px !important; font-family: var(--font-body) !important;
    font-weight: 700 !important; font-size: 14px !important;
    text-transform: none !important; padding: 8px 22px !important;
    transition: all var(--transition) !important;
  }
  .af-hero-add-btn:hover { background: #f0d050 !important; transform: scale(1.03); }

  /* ── PAGE BODY ── */
  .af-page { min-height: 100vh; background: var(--ink); }
  .af-body { max-width: 1280px; margin: 0 auto; padding: 40px 32px 80px; }
  @media (max-width: 600px) { .af-body { padding: 24px 16px 64px; } }

  /* ── COUNTRY TABS ── */
  .af-tabs {
    display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;
    scrollbar-width: none; margin-bottom: 40px;
  }
  .af-tabs::-webkit-scrollbar { display: none; }

  .af-tab {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 10px; padding: 8px 18px; cursor: pointer;
    font-family: var(--font-body); font-size: 13px; font-weight: 500;
    color: var(--muted); white-space: nowrap; flex-shrink: 0;
    transition: all var(--transition);
    display: flex; align-items: center; gap: 6px;
  }
  .af-tab:hover { background: var(--raised); color: #e0e0e8; }
  .af-tab.active {
    background: rgba(232,197,71,0.12); border-color: rgba(232,197,71,0.3);
    color: var(--accent); font-weight: 600;
  }

  /* ── SECTION ── */
  .af-section { margin-bottom: 48px; }

  .af-section-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
  }

  .af-section-title {
    font-family: var(--font-display); font-size: 22px; letter-spacing: 2px;
    color: #f0f0f5; display: flex; align-items: center; gap: 10px;
  }
  .af-section-icon { color: var(--accent2); }

  /* ── PERIOD TOGGLE ── */
  .af-period-toggle {
    display: flex; gap: 4px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 10px; padding: 4px;
  }
  .af-period-btn {
    background: none; border: none; cursor: pointer;
    font-family: var(--font-body); font-size: 12px; font-weight: 500;
    color: var(--muted); padding: 5px 12px; border-radius: 7px;
    transition: all var(--transition);
  }
  .af-period-btn.active {
    background: var(--raised); color: var(--accent); font-weight: 600;
  }
  .af-period-btn:hover:not(.active) { color: #e0e0e8; }

  /* ── HORIZONTAL SCROLL ROW ── */
  .af-scroll-wrap { position: relative; }
  .af-scroll-row {
    display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px;
    scrollbar-width: none; scroll-behavior: smooth;
  }
  .af-scroll-row::-webkit-scrollbar { display: none; }

  .af-scroll-btn {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--card); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 10; color: #e0e0e8;
    transition: all var(--transition);
  }
  .af-scroll-btn:hover { background: var(--raised); border-color: rgba(255,255,255,0.18); }
  .af-scroll-btn.left { left: -18px; }
  .af-scroll-btn.right { right: -18px; }
  @media (max-width: 600px) { .af-scroll-btn { display: none; } }

  /* ── MOVIE CARD ── */
  .af-movie-card {
    flex: 0 0 160px; background: var(--card);
    border: 1px solid var(--border); border-radius: var(--radius-md);
    overflow: hidden; transition: transform var(--transition), border-color var(--transition);
    cursor: pointer; text-decoration: none; display: block;
  }
  .af-movie-card:hover {
    transform: translateY(-6px);
    border-color: rgba(255,255,255,0.16);
    box-shadow: 0 16px 40px rgba(0,0,0,0.4);
  }
  @media (max-width: 600px) { .af-movie-card { flex: 0 0 140px; } }

  .af-card-poster-wrap {
    width: 100%; aspect-ratio: 2/3; overflow: hidden;
    background: var(--raised); position: relative;
  }
  .af-card-poster { width: 100%; height: 100%; object-fit: cover; display: block; }
  .af-card-poster-fallback {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 8px; color: var(--muted);
  }
  .af-card-rank {
    position: absolute; top: 8px; left: 8px;
    width: 26px; height: 26px; border-radius: 6px;
    background: rgba(15,15,18,0.85); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display); font-size: 14px; color: var(--accent);
  }
  .af-card-add {
    position: absolute; top: 8px; right: 8px;
    width: 28px; height: 28px; border-radius: 8px;
    background: rgba(232,197,71,0.9); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity var(--transition);
    color: var(--ink);
  }
  .af-movie-card:hover .af-card-add { opacity: 1; }

  .af-card-info { padding: 10px 12px 12px; }
  .af-card-title {
    font-size: 13px; font-weight: 600; color: #f0f0f5;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 6px;
  }
  .af-card-chips { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; }
  .af-chip {
    font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 20px;
  }
  .af-chip-rating {
    background: rgba(232,197,71,0.12); color: var(--accent);
    border: 1px solid rgba(232,197,71,0.2);
    display: flex; align-items: center; gap: 3px;
  }
  .af-chip-year { font-size: 11px; color: var(--muted); }

  /* ── LATEST GRID ── */
  .af-latest-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }
  @media (max-width: 600px) {
    .af-latest-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  }

  /* ── EMPTY STATE ── */
  .af-empty {
    text-align: center; padding: 48px 24px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }

  /* ── LOADING ── */
  .af-skeleton {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-md); overflow: hidden;
    flex: 0 0 160px;
  }
  .af-skeleton-poster {
    width: 100%; aspect-ratio: 2/3;
    background: linear-gradient(90deg, var(--raised) 25%, #2a2a35 50%, var(--raised) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }
  .af-skeleton-info { padding: 10px 12px; }
  .af-skeleton-line {
    height: 12px; border-radius: 6px; margin-bottom: 6px;
    background: linear-gradient(90deg, var(--raised) 25%, #2a2a35 50%, var(--raised) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }
  .af-skeleton-line.short { width: 60%; }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── ADD TO LIST TOAST ── */
  .af-toast-wrap {
    position: fixed; bottom: 24px; right: 24px;
    display: flex; flex-direction: column; gap: 8px; z-index: 500;
  }
  .af-toast {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 12px; padding: 12px 16px;
    font-size: 13px; color: #e0e0e8;
    display: flex; align-items: center; gap: 8px;
    animation: fadeUp 0.3s ease both;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .af-toast-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }
  .af-toast-success .af-toast-dot { background: var(--accent2); }
  .af-toast-error   .af-toast-dot { background: #ff6b6b; }
`;

// Country tab config
const TABS = [
  { key: "all", label: "🌍 All Africa" },
  { key: "NG",  label: "🇳🇬 Nollywood" },
  { key: "CM",  label: "🇨🇲 Cameroon"  },
  { key: "ZA",  label: "🇿🇦 South Africa" },
  { key: "GH",  label: "🇬🇭 Ghana"     },
  { key: "EG",  label: "🇪🇬 Egypt"     },
];

const PERIODS = [
  { key: "month", label: "This Month" },
  { key: "year",  label: "This Year"  },
  { key: "all",   label: "All Time"   },
];

const COUNTRY_NAMES = {
  NG: "Nigeria", CM: "Cameroon", ZA: "South Africa",
  GH: "Ghana", EG: "Egypt", MA: "Morocco", KE: "Kenya",
  TN: "Tunisia", SN: "Senegal",
};

// Toast system
let _afToastId = 0;
let _afSetToasts = null;
function afToast(msg, type = "success") {
  if (!_afSetToasts) return;
  const id = ++_afToastId;
  _afSetToasts(p => [...p, { id, msg, type }]);
  setTimeout(() => _afSetToasts(p => p.filter(t => t.id !== id)), 3000);
}
function AfToastContainer() {
  const [toasts, setToasts] = useState([]);
  _afSetToasts = setToasts;
  return (
    <div className="af-toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`af-toast af-toast-${t.type}`}>
          <div className="af-toast-dot" />{t.msg}
        </div>
      ))}
    </div>
  );
}

// Skeleton loader
function SkeletonRow({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="af-skeleton">
          <div className="af-skeleton-poster" />
          <div className="af-skeleton-info">
            <div className="af-skeleton-line" />
            <div className="af-skeleton-line short" />
          </div>
        </div>
      ))}
    </>
  );
}

// Single movie card
function AfMovieCard({ movie, rank, onAdd }) {
  const year = movie.release_date?.slice(0, 4);
  const rating = movie.vote_average?.toFixed(1);
  const country = COUNTRY_NAMES[movie.origin_country?.[0]] || movie.origin_country?.[0] || "";

  return (
    <a
      className="af-movie-card"
      href={`https://www.themoviedb.org/movie/${movie.id}`}
      target="_blank"
      rel="noreferrer"
    >
      <div className="af-card-poster-wrap">
        {movie.poster_path ? (
          <img
            className="af-card-poster"
            src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
            alt={movie.title}
            loading="lazy"
          />
        ) : (
          <div className="af-card-poster-fallback">
            <Movie sx={{ fontSize: 28, opacity: 0.3 }} />
          </div>
        )}
        {rank && <div className="af-card-rank">{rank}</div>}
        <button
          className="af-card-add"
          onClick={e => { e.preventDefault(); e.stopPropagation(); onAdd(movie); }}
          title="Add to my list"
        >
          <Add sx={{ fontSize: 16 }} />
        </button>
      </div>
      <div className="af-card-info">
        <div className="af-card-title" title={movie.title}>{movie.title}</div>
        <div className="af-card-chips">
          {rating && (
            <span className="af-chip af-chip-rating">
              <Star sx={{ fontSize: 10 }} />{rating}
            </span>
          )}
          {year && <span className="af-chip-year">{year}</span>}
        </div>
      </div>
    </a>
  );
}

// Horizontal scroll section
function ScrollSection({ title, icon, movies, loading, onAdd, showRank = false, rightContent }) {
  const scrollRef = useRef(null);

  function scroll(dir) {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 360, behavior: "smooth" });
    }
  }

  return (
    <div className="af-section fade-up">
      <div className="af-section-header">
        <div className="af-section-title">
          <span className="af-section-icon">{icon}</span>
          {title}
        </div>
        {rightContent}
      </div>
      <div className="af-scroll-wrap">
        <button className="af-scroll-btn left" onClick={() => scroll(-1)}>
          <ChevronLeft sx={{ fontSize: 20 }} />
        </button>
        <div className="af-scroll-row" ref={scrollRef}>
          {loading
            ? <SkeletonRow count={6} />
            : movies.length === 0
            ? (
              <div style={{ padding: "24px", color: "var(--muted)", fontSize: 14 }}>
                No movies found for this selection
              </div>
            )
            : movies.map((m, i) => (
              <AfMovieCard
                key={m.id}
                movie={m}
                rank={showRank ? i + 1 : null}
                onAdd={onAdd}
              />
            ))
          }
        </div>
        <button className="af-scroll-btn right" onClick={() => scroll(1)}>
          <ChevronRight sx={{ fontSize: 20 }} />
        </button>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────
function AfricanPage() {
  useFonts();
  const navigate = useNavigate();

  const [activeTab,    setActiveTab]    = useState("all");
  const [period,       setPeriod]       = useState("year");
  const [featured,     setFeatured]     = useState(null);
  const [topRated,     setTopRated]     = useState([]);
  const [latest,       setLatest]       = useState([]);
  const [loadingTop,   setLoadingTop]   = useState(true);
  const [loadingLatest,setLoadingLatest]= useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [latestPage,   setLatestPage]   = useState(1);
  const [hasMoreLatest,setHasMoreLatest]= useState(true);

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch { navigate("/login"); }
  }, []);

  // Load featured once
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/african/featured`)
      .then(r => r.json())
      .then(data => setFeatured(data))
      .catch(() => setFeatured(null));
  }, []);

  // Load top rated when tab or period changes
  useEffect(() => {
    loadTopRated();
  }, [activeTab, period]);

  // Load latest when tab changes
  useEffect(() => {
    setLatestPage(1);
    setHasMoreLatest(true);
    loadLatest(1, false);
  }, [activeTab]);

  async function loadTopRated() {
    setLoadingTop(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/african/top-rated?country=${activeTab}&period=${period}`
      );
      const data = await res.json();
      setTopRated(data.movies || []);
    } catch { setTopRated([]); }
    finally { setLoadingTop(false); }
  }

  async function loadLatest(page = 1, append = false) {
    if (page === 1) setLoadingLatest(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/african/latest?country=${activeTab}&page=${page}`
      );
      const data = await res.json();
      const movies = data.movies || [];
      if (append) {
        setLatest(prev => [...prev, ...movies]);
      } else {
        setLatest(movies);
      }
      setHasMoreLatest(page < (data.total_pages || 1));
    } catch {
      if (!append) setLatest([]);
    }
    finally {
      setLoadingLatest(false);
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    const next = latestPage + 1;
    setLatestPage(next);
    loadLatest(next, true);
  }

  // Add movie to personal list
  async function handleAddMovie(movie) {
    navigate("/add-movie", {
      state: {
        movie: {
          id:           movie.id,
          title:        movie.title,
          poster_path:  movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
        }
      }
    });
  }

  const featuredCountry = featured?.origin_country?.[0];

  return (
    <>
      <style>{STYLES}</style>
      <AfToastContainer />

      <div className="af-page">

        {/* ── NAV ── */}
        <nav className="af-nav">
  <div className="af-logo" onClick={() => navigate("/home")}>
    <div className="af-logo-icon">
      <Movie sx={{ fontSize: 18 }} />
    </div>
    MOVIE RATER
  </div>

  <span className="af-nav-badge">AFRICAN CINEMA</span>

  <div className="af-nav-actions">
    <Button
      className="af-nav-btn"
      startIcon={<Add sx={{ fontSize: 15 }} />}
      onClick={() => navigate("/african/submit")}
    >
      Submit Movie
    </Button>

    <Button
      className="af-nav-btn"
      startIcon={<ArrowBack sx={{ fontSize: 15 }} />}
      onClick={() => navigate("/home")}
    >
      Back to Home
    </Button>
  </div>
</nav>

        {/* ── HERO ── */}
        <div className="af-hero">
          {featured?.backdrop_path ? (
            <div
              className="af-hero-bg"
              style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${featured.backdrop_path})` }}
            />
          ) : (
            <div className="af-hero-fallback">
              <Public sx={{ fontSize: 80, color: "rgba(232,197,71,0.1)" }} />
            </div>
          )}
          <div className="af-hero-content">
            <div className="af-hero-eyebrow">FEATURED FILM</div>
            {featured ? (
              <>
                <Typography className="af-hero-title">{featured.title}</Typography>
                <div className="af-hero-meta">
                  {featured.vote_average && (
                    <span className="af-hero-chip af-hero-chip-rating">
                      ⭐ {featured.vote_average?.toFixed(1)} TMDB
                    </span>
                  )}
                  {featuredCountry && (
                    <span className="af-hero-chip af-hero-chip-country">
                      {COUNTRY_NAMES[featuredCountry] || featuredCountry}
                    </span>
                  )}
                  {featured.release_date && (
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                      {featured.release_date.slice(0, 4)}
                    </span>
                  )}
                </div>
                <Button
                  className="af-hero-add-btn"
                  startIcon={<Add sx={{ fontSize: 16 }} />}
                  onClick={() => handleAddMovie(featured)}
                >
                  Add to my list
                </Button>
              </>
            ) : (
              <>
                <Typography className="af-hero-title">AFRICAN CINEMA</Typography>
                <Typography sx={{ fontSize: 15, color: "rgba(255,255,255,0.5)", mb: 2 }}>
                  Discover the best of African film
                </Typography>
              </>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="af-body">

          {/* Country tabs */}
          <div className="af-tabs fade-up">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`af-tab${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Top Rated */}
          <ScrollSection
            title="TOP RATED"
            icon={<TrendingUp sx={{ fontSize: 20 }} />}
            movies={topRated}
            loading={loadingTop}
            onAdd={handleAddMovie}
            showRank={true}
            rightContent={
              <div className="af-period-toggle">
                {PERIODS.map(p => (
                  <button
                    key={p.key}
                    className={`af-period-btn${period === p.key ? " active" : ""}`}
                    onClick={() => setPeriod(p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            }
          />

          {/* Latest Releases */}
          <div className="af-section fade-up">
            <div className="af-section-header">
              <div className="af-section-title">
                <NewReleases className="af-section-icon" sx={{ fontSize: 20 }} />
                LATEST RELEASES
                <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-body)", fontWeight: 400, letterSpacing: 0 }}>
                  · last 30 days
                </span>
              </div>
              <button
                onClick={() => { setLatestPage(1); loadLatest(1, false); }}
                style={{
                  background: "none", border: "none", color: "var(--muted)",
                  cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)",
                  display: "flex", alignItems: "center", gap: 4, transition: "color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#e0e0e8"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
              >
                <Refresh sx={{ fontSize: 16 }} /> Refresh
              </button>
            </div>

            {loadingLatest ? (
              <div className="af-latest-grid">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="af-skeleton">
                    <div className="af-skeleton-poster" />
                    <div className="af-skeleton-info">
                      <div className="af-skeleton-line" />
                      <div className="af-skeleton-line short" />
                    </div>
                  </div>
                ))}
              </div>
            ) : latest.length === 0 ? (
              <div className="af-empty">
                <Typography sx={{ fontFamily: "var(--font-display)", fontSize: 20, letterSpacing: 2, color: "var(--muted)" }}>
                  NO RECENT RELEASES FOUND
                </Typography>
                <Typography sx={{ fontSize: 13, color: "var(--muted)", mt: 1 }}>
                  Try a different country or check back soon
                </Typography>
              </div>
            ) : (
              <>
                <div className="af-latest-grid">
                  {latest.map(m => (
                    <AfMovieCard key={m.id} movie={m} onAdd={handleAddMovie} />
                  ))}
                </div>

                {/* Load more */}
                {hasMoreLatest && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      sx={{
                        background: "var(--card)", border: "1px solid var(--border)",
                        borderRadius: "12px", color: "#e0e0e8",
                        fontFamily: "var(--font-body)", fontSize: 14,
                        fontWeight: 500, padding: "10px 40px",
                        textTransform: "none", transition: "all 0.2s",
                        "&:hover": { background: "var(--raised)", borderColor: "rgba(255,255,255,0.18)" },
                      }}
                    >
                      {loadingMore ? "Loading…" : "Load more"}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

export default AfricanPage;