import { useEffect, useState } from "react";
import { useRef } from "react";
import { apiFetch, saveToken, deleteToken, getToken } from "../api";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import {
  AppBar, Toolbar, Box, Avatar, InputBase,
  Button, Stack, Paper, Typography, Tooltip, Select, MenuItem,
} from "@mui/material";
import {
  Add, Favorite, SentimentVeryDissatisfied, SentimentNeutral,
  Logout, Search, Movie, Star, Instagram, Twitter, YouTube,
  OpenInNew, TrendingUp, Edit, Delete,
  ViewModule, ViewList, Sort,PersonSearch, Notifications, NotificationsNone, 
} from "@mui/icons-material";


import "./HomePage.css";

/* ─── Google Fonts ─── */
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

const MOVIES_PER_PAGE = 10;

/* ── Sort options matching backend ── */
const SORT_OPTIONS = [
  { value: "",             label: "Default" },
  { value: "mine_desc",    label: "My Rating ↓" },
  { value: "mine_asc",     label: "My Rating ↑" },
  { value: "tmdb_desc",    label: "TMDB Rating ↓" },
  { value: "tmdb_asc",     label: "TMDB Rating ↑" },
  { value: "watched_desc", label: "Date Watched ↓" },
  { value: "watched_asc",  label: "Date Watched ↑" },
  { value: "release_desc", label: "Release Date ↓" },
  { value: "release_asc",  label: "Release Date ↑" },
];

/* ── Toast system ── */
let _toastId = 0;
let _setToasts = null;
function toast(msg, type = "success") {
  if (!_setToasts) return;
  const id = ++_toastId;
  _setToasts((p) => [...p, { id, msg, type }]);
  setTimeout(() => _setToasts((p) => p.filter((t) => t.id !== id)), 3200);
}
function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-dot" />{t.msg}
        </div>
      ))}
    </div>
  );
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-poster" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line medium" />
        <div className="skeleton skeleton-line short" />
        <div className="skeleton-btns">
          <div className="skeleton skeleton-btn" />
          <div className="skeleton skeleton-btn" />
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function EmojiForRating({ rating, size = 13 }) {
  if (rating >= 80) return <Favorite sx={{ fontSize: size, color: "#ff6b6b" }} />;
  if (rating <= 40) return <SentimentVeryDissatisfied sx={{ fontSize: size, color: "#ff6b6b" }} />;
  return <SentimentNeutral sx={{ fontSize: size, color: "#e8c547" }} />;
}

/*── time helper ─────*/
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Sidebar list ── */
function SideList({ title, movies, worst = false }) {
  return (
    <div className="side-panel fade-up">
      <div className="side-panel-title">
        {worst ? <SentimentVeryDissatisfied sx={{ fontSize: 18 }} /> : <Favorite sx={{ fontSize: 18 }} />}
        {title}
      </div>
      <Stack spacing={1}>
        {movies.length === 0 && <Typography sx={{ color: "var(--muted)", fontSize: 13, py: 1 }}>No movies yet</Typography>}
        {movies.map((m, i) => (
          <div className="side-movie-row" key={m.id}>
            <span className="side-rank">{i + 1}</span>
            <span className="side-movie-title" title={m.title}>{m.title}</span>
            <span className={`side-rating${worst ? " worst" : ""}`}>{m.my_rating}/100</span>
          </div>
        ))}
      </Stack>
    </div>
  );
}

/* ── Delete confirm ── */
function DeleteConfirm({ movieTitle, onCancel, onConfirm, loading }) {
  return (
    <div className="del-overlay" onClick={onCancel}>
      <div className="del-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="del-icon-wrap"><Delete sx={{ fontSize: 24, color: "#ff6b6b" }} /></div>
        <div className="del-title">DELETE MOVIE</div>
        <div className="del-body">
          Are you sure you want to remove <span className="del-movie-name">"{movieTitle}"</span> from your list? This cannot be undone.
        </div>
        <div className="del-actions">
          <Button className="del-btn-cancel" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button className="del-btn-confirm" onClick={onConfirm} disabled={loading}>{loading ? "Deleting…" : "Yes, delete"}</Button>
        </div>
      </div>
    </div>
  );
}

/*GRID CARD*/
function MovieCard({ movie, onDelete, onEdit, animDelay = 0 }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting,    setDeleting]    = useState(false);

async function confirmDelete() {
  setDeleting(true);
  try {
    const res = await apiFetch("/delete", {
      method: "POST",
      body: JSON.stringify({ movieId: movie.id }),
    });
    if (!res) return;
    toast(`"${movie.title}" removed`, "success");
    onDelete && onDelete(movie.id);
  } catch {
    toast("Failed to delete. Try again.", "error");
    setShowConfirm(false);
  } finally {
    setDeleting(false);
  }
}

  const year = movie.release_date?.slice(0, 4);

  return (
    <>
      {showConfirm && <DeleteConfirm movieTitle={movie.title} onCancel={() => setShowConfirm(false)} onConfirm={confirmDelete} loading={deleting} />}
      <a className="movie-card fade-up" style={{ animationDelay: `${animDelay}s` }}
        href={`https://www.themoviedb.org/movie/${movie.tmdb_id}`} target="_blank" rel="noreferrer">
        {movie.poster_path ? (
          <div className="movie-card-poster-wrap">
            <img className="movie-card-poster" src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} alt={movie.title} loading="lazy" />
            {year && <div className="poster-year-pill">{year}</div>}
          </div>
        ) : (
          <div className="movie-card-poster-fallback">
            <Movie sx={{ fontSize: 32, opacity: 0.3 }} />
            <div className="fallback-title">{movie.title}</div>
          </div>
        )}
        <div className="movie-card-body">
          <div className="movie-card-title" title={movie.title}>{movie.title}</div>
          <div className="movie-card-ratings">
            <span className="rating-chip rating-tmdb">TMDB&nbsp;{movie.tmdb_rating ?? "—"}</span>
            <span className="rating-chip rating-mine">Mine&nbsp;{movie.my_rating}/100</span>
            <div className="emoji-badge"><EmojiForRating rating={movie.my_rating} /></div>
          </div>
          {movie.remarks ? <div className="movie-card-remarks">{movie.remarks}</div> : null}
          <div className="card-actions">
            <Button className="card-btn card-btn-edit" size="small" startIcon={<Edit sx={{ fontSize: 11 }} />}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit && onEdit(movie); }}>Edit</Button>
            <Button className="card-btn card-btn-delete" size="small" startIcon={<Delete sx={{ fontSize: 11 }} />}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true); }}>Delete</Button>
          </div>
        </div>
      </a>
    </>
  );
}

/* LIST ROW */
function MovieListRow({ movie, index, onDelete, onEdit }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  async function confirmDelete() {
    setDeleting(true);
    try {
      const res = await apiFetch("/delete", {
        method: "POST",
        body: JSON.stringify({ movieId: movie.id }),
      });
      if (!res) return;
      toast(`"${movie.title}" removed`, "success");
      onDelete && onDelete(movie.id);
    } catch {
      toast("Failed to delete. Try again.", "error");
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  const year = movie.release_date?.slice(0, 4);

  return (
    <>
      {showConfirm && <DeleteConfirm movieTitle={movie.title} onCancel={() => setShowConfirm(false)} onConfirm={confirmDelete} loading={deleting} />}
      <a className="movie-list-row fade-up" style={{ animationDelay: `${index * 0.03}s` }}
        href={`https://www.themoviedb.org/movie/${movie.tmdb_id}`} target="_blank" rel="noreferrer">

        <span className="list-rank">{index + 1}</span>

        {movie.poster_path
          ? <img className="list-poster" src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt={movie.title} loading="lazy" />
          : <div className="list-poster-fallback"><Movie sx={{ fontSize: 16, color: "var(--muted)" }} /></div>
        }

        <div className="list-info">
          <div className="list-title" title={movie.title}>{movie.title}</div>
          <div className="list-meta">
            <span className="rating-chip rating-tmdb" style={{ fontSize: 10 }}>TMDB&nbsp;{movie.tmdb_rating ?? "—"}</span>
            <span className="rating-chip rating-mine" style={{ fontSize: 10 }}>Mine&nbsp;{movie.my_rating}/100</span>
            <EmojiForRating rating={movie.my_rating} size={14} />
            {year && <span style={{ fontSize: 11, color: "var(--muted)" }}>{year}</span>}
          </div>
          {movie.remarks && <div className="list-remarks">{movie.remarks}</div>}
        </div>

        <div className="list-actions">
          <Button className="list-btn card-btn-edit" size="small" startIcon={<Edit sx={{ fontSize: 11 }} />}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit && onEdit(movie); }}>Edit</Button>
          <Button className="list-btn card-btn-delete" size="small" startIcon={<Delete sx={{ fontSize: 11 }} />}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true); }}>Delete</Button>
        </div>
      </a>
    </>
  );
}

/* ── TMDB Widget ── */
function TmdbTopRated() {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/top-movies`).then((r) => setFilms(r.data || [])).catch(() => setFilms([])).finally(() => setLoading(false));
  }, []);
  return (
    <div className="side-panel fade-up">
      <div className="side-panel-title"><TrendingUp sx={{ fontSize: 18 }} />TOP TMDB {year}</div>
      {loading && <div className="tmdb-loading">Loading…</div>}
      {!loading && films.length === 0 && <div className="tmdb-loading">Could not load.</div>}
      <Stack spacing={1}>
        {films.map((film, i) => (
          <a key={film.id} className="tmdb-row" href={`https://www.themoviedb.org/movie/${film.id}`} target="_blank" rel="noreferrer">
            <span className="tmdb-rank">{i + 1}</span>
            {film.poster_path ? <img className="tmdb-poster" src={`https://image.tmdb.org/t/p/w92${film.poster_path}`} alt={film.title} /> : <div className="tmdb-poster" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}><Movie sx={{ fontSize: 16, color: "var(--muted)" }} /></div>}
            <div className="tmdb-info">
              <div className="tmdb-title">{film.title}</div>
              <div className="tmdb-score"><Star sx={{ fontSize: 11, color: "var(--accent)" }} />{film.vote_average?.toFixed(1)}</div>
            </div>
            <OpenInNew sx={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }} />
          </a>
        ))}
      </Stack>
    </div>
  );
}

/* ── Social Widget ── */
function SocialWidget() {
  const links = [
    { label: "Instagram",   handle: "@cinemalist",        href: "https://instagram.com", icon: <Instagram sx={{ fontSize: 18, color: "#E1306C" }} />, bg: "rgba(225,48,108,0.12)" },
    { label: "Twitter / X", handle: "@cinemalist",        href: "https://twitter.com",   icon: <Twitter   sx={{ fontSize: 18, color: "#1DA1F2" }} />, bg: "rgba(29,161,242,0.12)"  },
    { label: "YouTube",     handle: "Cinemalist Reviews", href: "https://youtube.com",   icon: <YouTube   sx={{ fontSize: 18, color: "#FF0000" }} />, bg: "rgba(255,0,0,0.12)"      },
  ];
  return (
    <div className="side-panel fade-up">
      <div className="side-panel-title"><Star sx={{ fontSize: 18 }} />FOLLOW US</div>
      <Stack spacing={1}>
        {links.map((s) => (
          <a key={s.label} className="social-link" href={s.href} target="_blank" rel="noreferrer">
            <div className="social-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div><div className="social-label">{s.label}</div><div className="social-handle">{s.handle}</div></div>
            <OpenInNew sx={{ fontSize: 13, color: "var(--muted)", marginLeft: "auto" }} />
          </a>
        ))}
      </Stack>
    </div>
  );
}
/* ── SEARCH MODAL ────*/
function SearchModal({ onClose, navigate }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followed, setFollowed] = useState({});
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/search/users?q=${encodeURIComponent(query)}`);
        const data = await res?.json();
        setResults(Array.isArray(data) ? data : []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function toggleFollow(user) {
    const isFollowing = followed[user.id] ?? !!parseInt(user.is_following);
    try {
      if (isFollowing) {
        await apiFetch(`/follow/${user.id}`, { method: "DELETE" });
        setFollowed(p => ({ ...p, [user.id]: false }));
      } else {
        await apiFetch(`/follow/${user.id}`, { method: "POST" });
        setFollowed(p => ({ ...p, [user.id]: true }));
      }
    } catch (err) { console.error(err); }
  }

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-modal-input-wrap">
          <Search sx={{ color: "var(--muted)", fontSize: 20, flexShrink: 0 }} />
          <input
            className="search-modal-input"
            placeholder="Search users by username…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button className="search-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="search-results">
          {loading && <div className="search-loading">Searching…</div>}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="search-empty">No users found for "{query}"</div>
          )}
          {!loading && query.length < 2 && (
            <div className="search-empty">Type at least 2 characters to search</div>
          )}
          {results.map(user => {
            const isFollowing = followed[user.id] !== undefined
              ? followed[user.id]
              : !!parseInt(user.is_following);
            return (
              <div key={user.id} className="search-result-item">
                <Avatar
                  src={user.profile_pic}
                  sx={{ width: 42, height: 42, background: "var(--raised)", fontSize: 16, fontFamily: "var(--font-display)", flexShrink: 0, cursor: "pointer" }}
                  onClick={() => { onClose(); navigate(`/profile/${user.username}`); }}
                >
                  {!user.profile_pic && user.username?.charAt(0).toUpperCase()}
                </Avatar>
                <div
                  className="search-result-info"
                  onClick={() => { onClose(); navigate(`/profile/${user.username}`); }}
                >
                  <div className="search-result-username">@{user.username}</div>
                  {user.bio && <div className="search-result-bio">{user.bio}</div>}
                  <div className="search-result-meta">
                    {user.follower_count} follower{user.follower_count !== 1 ? "s" : ""}
                    {!user.is_public && " · 🔒 Private"}
                  </div>
                </div>
                <Button
                  className={isFollowing ? "search-unfollow-btn" : "search-follow-btn"}
                  onClick={e => { e.stopPropagation(); toggleFollow(user); }}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
/* ── NOTIFICATIONS BELL ──*/
function NotificationsBell() {
  const navigate = useNavigate();
  const [open, setOpen]           = useState(false);
  const [notifs, setNotifs]       = useState([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const dropdownRef               = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Poll unread count every 60s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUnreadCount() {
    try {
      const res = await apiFetch("/notifications/unread-count");
      const data = await res?.json();
      if (data) setUnread(data.count);
    } catch {}
  }

  async function handleOpen() {
    setOpen(o => !o);
    if (!open) {
      setLoading(true);
      try {
        const res = await apiFetch("/notifications");
        const data = await res?.json();
        setNotifs(Array.isArray(data) ? data : []);
        // Mark all read
        await apiFetch("/notifications/read", { method: "PUT" });
        setUnread(0);
      } catch {}
      finally { setLoading(false); }
    }
  }

  return (
    <div className="notif-wrap" ref={dropdownRef}>
      <button className="notif-btn" onClick={handleOpen}>
        {unread > 0
          ? <Notifications sx={{ fontSize: 22, color: "var(--accent)" }} />
          : <NotificationsNone sx={{ fontSize: 22 }} />
        }
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-title">NOTIFICATIONS</span>
            {notifs.some(n => !n.read) && (
              <button className="notif-mark-read" onClick={async () => {
                await apiFetch("/notifications/read", { method: "PUT" });
                setNotifs(p => p.map(n => ({ ...n, read: true })));
                setUnread(0);
              }}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notif-list">
            {loading && <div className="notif-empty">Loading…</div>}
            {!loading && notifs.length === 0 && (
              <div className="notif-empty">No notifications yet</div>
            )}
            {notifs.map(n => (
              <div
                key={n.id}
                className={`notif-item${!n.read ? " unread" : ""}`}
                onClick={() => { setOpen(false); navigate(`/profile/${n.actor_username}`); }}
              >
                <Avatar
                  src={n.actor_pic}
                  sx={{ width: 36, height: 36, background: "var(--raised)", fontSize: 14, fontFamily: "var(--font-display)", flexShrink: 0 }}
                >
                  {!n.actor_pic && n.actor_username?.charAt(0).toUpperCase()}
                </Avatar>
                <div className="notif-item-text">
                  <span>@{n.actor_username}</span> started following you
                </div>
                <span className="notif-item-time">{timeAgo(n.created_at)}</span>
                {!n.read && <div className="notif-unread-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
/* ── ACTIVITY FEED SIDEBAR */
function ActivityFeed() {
  const navigate = useNavigate();
  const [feed, setFeed]       = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadFeed() {
    try {
      const res = await apiFetch("/feed");
      const data = await res?.json();
      setFeed(Array.isArray(data) ? data : []);
    } catch { setFeed([]); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="side-panel fade-up">
      <div className="side-panel-title" style={{ justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <TrendingUp sx={{ fontSize: 18 }} /> FOLLOWING ACTIVITY
        </span>
        <button
          onClick={loadFeed}
          style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-body)", transition: "color 0.2s" }}
          onMouseEnter={e => e.target.style.color = "#e0e0e8"}
          onMouseLeave={e => e.target.style.color = "var(--muted)"}
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <Typography sx={{ color: "var(--muted)", fontSize: 13, py: 1 }}>Loading…</Typography>
      )}

      {!loading && feed.length === 0 && (
        <Typography sx={{ color: "var(--muted)", fontSize: 13, py: 1, lineHeight: 1.5 }}>
          Follow people to see their activity here
        </Typography>
      )}

      <Stack spacing={1}>
        {feed.map((item, i) => (
          <div
            key={`${item.feed_type}-${item.id}-${i}`}
            style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "10px 12px", background: "var(--raised)",
              borderRadius: 10, cursor: "pointer",
              transition: "background 0.2s",
            }}
            onClick={() => navigate(`/profile/${item.username}`)}
            onMouseEnter={e => e.currentTarget.style.background = "#2e2e3a"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--raised)"}
          >
            <Avatar
              src={item.profile_pic}
              sx={{ width: 32, height: 32, fontSize: 13, flexShrink: 0, background: "var(--card)", fontFamily: "var(--font-display)" }}
            >
              {!item.profile_pic && item.username?.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              {item.feed_type === "follow" ? (
                <div style={{ fontSize: 12, color: "#e0e0e8", lineHeight: 1.4 }}>
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>@{item.follower_username}</span>
                  {" followed "}
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>@{item.username}</span>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "#e0e0e8", lineHeight: 1.4 }}>
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>@{item.username}</span>
                  {item.type === "added"   && " added "}
                  {item.type === "edited"  && " updated "}
                  {item.type === "deleted" && " removed "}
                  <span style={{ color: "#f0f0f5", fontWeight: 500 }}>{item.title}</span>
                  {item.my_rating && item.type !== "deleted" && (
                    <span style={{ color: "var(--accent2)" }}> ⭐ {item.my_rating}/100</span>
                  )}
                </div>
              )}
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                {timeAgo(item.created_at)}
              </div>
            </div>
            {item.poster_path && item.feed_type === "activity" && (
              <img
                src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                alt={item.title}
                style={{ width: 28, height: 40, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
              />
            )}
          </div>
        ))}
      </Stack>
    </div>
  );
}

/* ── Main page ── */
function HomePage() {
  useFonts();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showSearch, setShowSearch] = useState(false);
  const [page,        setPage]        = useState(0);
  const [hasMore,     setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalMovies, setTotalMovies] = useState(0);
  const [avgRating,      setAvgRating]      = useState(0);
  const [topRatedTitle,  setTopRatedTitle]  = useState(null);

  const token = getToken();
 
  


  let currentUser = null;
if (token) {
  try { currentUser = JSON.parse(atob(token.split(".")[1])); } catch (_) {}
}

async function fetchMovies(sort = sortBy, pageNum = 0, append = false) {
  if (pageNum === 0) setLoading(true);
  else setLoadingMore(true);

  try {
    // Build query params
    const params = new URLSearchParams();
    if (sort) params.set("sort", sort);
    params.set("page", pageNum);
    params.set("limit", MOVIES_PER_PAGE);

    const res = await apiFetch(`/movies?${params.toString()}`);
    if (!res) return;

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    const d = await res.json();
    const raw = Array.isArray(d.movies) ? d.movies : [];

    const normalized = raw.map((m) => ({
      id:            m.id,
      tmdb_id:       m.movie_id ?? m.id,
      title:         m.title ?? "Untitled",
      poster_path:   m.poster_path ?? null,
      tmdb_rating:   m.tmdb_rating ?? null,
      my_rating:     Number(m.my_rating ?? 50),
      remarks:       m.remarks ?? "",
      release_date:  m.release_date ?? "",
      watched_month: m.watched_month ?? null,
      watched_year:  m.watched_year ?? null,
    }));

    // Append for load more, replace for fresh load
    if (append) {
      setMovies(prev => [...prev, ...normalized]);
    } else {
      setMovies(normalized);
    }

    setTotalMovies(d?.total ?? 0);
    setAvgRating(d?.avg_rating ?? 0);
    setTopRatedTitle(d?.top_rated_title ?? null);
    setProfilePic(d?.profile_pic ?? "");
    setEmail(d?.email ? d.email.split("@")[0] : "user");

    // If we got fewer than a full page, no more to load
    setHasMore(raw.length === MOVIES_PER_PAGE);

  } catch (err) {
    console.log("fetchMovies error:", err);
    toast("Failed to load movies", "error");
  } finally {
    setLoading(false);
    setLoadingMore(false);
  }
}

function handleLoadMore() {
  const nextPage = page + 1;
  setPage(nextPage);
  fetchMovies(sortBy, nextPage, true);
}

function handleSortChange(newSort) {
  setSortBy(newSort);
  setPage(0);
  setHasMore(true);
  fetchMovies(newSort, 0, false);
}

useEffect(() => {
  // Fix Facebook #_=_
  if (window.location.hash === "#_=_") {
    window.history.replaceState(null, "", window.location.pathname);
  }

  // Save OAuth token from URL if present
  const params = new URLSearchParams(window.location.search);
  const URLtoken = params.get("token");
  if (URLtoken) {
    localStorage.setItem("token", URLtoken);
    window.history.replaceState({}, "", "/home");
  }

  // Check token exists
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login");
    return;
  }

  // Check token not expired
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }
  } catch {
    localStorage.removeItem("token");
    navigate("/login");
    return;
  }

  fetchMovies(sortBy, 0, false);
}, []);

  async function handleLogout() {
    deleteToken();
    navigate("/login");
  }

  async function handleAddMovie() {
    if (!movieTitle.trim()) return;

    setSearching(true);

    try {
      const res = await apiFetch(`/movie/${movieTitle}`);

      if (!res) return;

      const data = await res.json();

      navigate("/add-movie", {
        state: { movie: data },
      });
    } catch {
      toast("Movie not found. Try a different title.", "error");
    } finally {
      setSearching(false);
    }
  }

//derived values for sidebar and display
const safeMovies = Array.isArray(movies) ? movies : [];
const best       = [...safeMovies].sort((a, b) => b.my_rating - a.my_rating).slice(0, 5);
const worst      = [...safeMovies].sort((a, b) => a.my_rating - b.my_rating).slice(0, 5);
const displayed  = search.trim()
  ? safeMovies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
  : safeMovies;
const initial    = email.charAt(0).toUpperCase();

  return (
    <>
      
      <ToastContainer />
      <Box sx={{ minHeight: "100vh", bgcolor: "var(--ink)" }}>

        {/* NAVBAR */}
        <AppBar position="sticky" className="nav-bar" elevation={0}>
        
<Toolbar sx={{ px: { xs: 2, md: 4 }, gap: 2, minHeight: "68px !important" }}>
  <Box className="nav-logo" onClick={() => navigate("/home")}>
    <div className="logo-icon"><Movie sx={{ fontSize: 20 }} /></div>
    MOVIE RATER
  </Box>
  <Box sx={{ flex: 1 }} />
  <Box className="search-wrap">
    <Search sx={{ color: "var(--muted)", fontSize: 18 }} />
    <input
      placeholder="Search your movies…"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </Box>
  <Box sx={{ flex: 1 }} />
  <Stack direction="row" spacing={1} alignItems="center">

    {/* User search icon */}
    <Tooltip title="Find users">
      <button className="nav-icon-btn" onClick={() => setShowSearch(true)}>
        <PersonSearch sx={{ fontSize: 22 }} />
      </button>
    </Tooltip>

    {/* Notifications */}
    <NotificationsBell />

    {/* Avatar — clickable to own profile */}
    <Tooltip title="My profile">
      <div
        style={{ cursor: "pointer" }}
        onClick={() => navigate(`/profile/${currentUser?.username}`)}
      >
        {profilePic
          ? <Avatar src={profilePic} sx={{ width: 38, height: 38 }} />
          : <div className="nav-avatar-initials">{initial}</div>
        }
      </div>
    </Tooltip>

    <Typography sx={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "#e0e0e8", display: { xs: "none", sm: "block" } }}>
      Hello, {email}!
    </Typography>

    <Tooltip title="Log out">
      <Button className="logout-btn" size="small" startIcon={<Logout sx={{ fontSize: 16 }} />} onClick={handleLogout}>
        Log out
      </Button>
    </Tooltip>
  </Stack>
</Toolbar>
        </AppBar>

        <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>

          {/* Add bar */}
          <Box sx={{ mb: 4 }} className="fade-up">
            <Paper className="add-movie-paper" elevation={0}>
              <InputBase className="add-movie-input" fullWidth placeholder="What did you watch? Type a title and hit Add…"
                value={movieTitle} onChange={(e) => setMovieTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMovie()} sx={{ color: "#e0e0e8", fontSize: 15 }} />
              <Button className="add-btn" startIcon={<Add />} onClick={handleAddMovie} disabled={searching}>
                {searching ? "Searching…" : "Add Movie"}
              </Button>
            </Paper>
          </Box>

          <Grid container spacing={3} sx={{ flexWrap: { md: "nowrap" }, alignItems: "flex-start" }}>

            {/* SIDEBAR */}
            <Grid item xs={12} sx={{ width: { md: "280px" }, flexShrink: { md: 0 }, flexGrow: { md: 0 } }}>
              <div className="sidebar-scroll-wrap">
                <Box sx={{ position: "sticky", top: 90, width: "100%", maxHeight: "calc(100vh - 110px)", overflowY: "auto", overflowX: "hidden", pr: "4px", pb: "48px" }}>
                  <Stack spacing={3}>
                    <TmdbTopRated />
                    <ActivityFeed /> 
                    <SideList title="Favorites"   movies={best}  />
                    <SideList title="Worst Watch" movies={worst} worst />

                    <SocialWidget />
                  </Stack>
                </Box>
              </div>
            </Grid>

            {/* CENTER */}
            <Grid item xs={12} sx={{ flex: { md: "1 1 0" }, minWidth: 0, overflow: "hidden" }}>

              {/* Stat bar */}
{!loading && totalMovies > 0 && (
  <div className="stat-bar fade-up">
    <div className="stat-item">
      <span className="stat-num">{totalMovies}</span>
      <span className="stat-label">movies</span>
    </div>
    <div className="stat-divider" />
    <div className="stat-item">
      <span className="stat-num">{avgRating}</span>
      <span className="stat-label">avg score</span>
    </div>
    {topRatedTitle && (
      <>
        <div className="stat-divider" />
        <div className="stat-item" style={{ minWidth: 0, overflow: "hidden" }}>
          <span style={{
            fontSize: 13, color: "var(--accent2)",
            fontFamily: "var(--font-body)", fontWeight: 600,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>
            {topRatedTitle}
          </span>
          <span className="stat-label" style={{ marginLeft: 5 }}>top rated</span>
        </div>
      </>
    )}
  </div>
)}

              {/* Toolbar: sort + view toggle + section label */}
              <div className="toolbar-row fade-up">
                {/* Sort dropdown */}
                <Sort sx={{ color: "var(--muted)", fontSize: 18, flexShrink: 0 }} />
                <Select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  displayEmpty
                  variant="outlined"
                  sx={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    color: "#e0e0e8",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    height: 36,
                    "& .MuiSelect-select": { py: "6px", px: "12px", fontFamily: "var(--font-body)", fontSize: 13, color: "#e0e0e8" },
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    "& .MuiSvgIcon-root": { color: "var(--muted)" },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        mt: 0.5,
                        "& .MuiMenuItem-root": {
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          color: "#e0e0e8",
                          "&:hover": { background: "var(--raised)" },
                          "&.Mui-selected": { background: "rgba(232,197,71,0.12)", color: "var(--accent)" },
                          "&.Mui-selected:hover": { background: "rgba(232,197,71,0.18)" },
                        },
                      },
                    },
                  }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>

                <Box sx={{ flex: 1 }} />

                {/* View toggle */}
                <div className="view-toggle">
                  <button className={`view-btn${viewMode === "grid" ? " active" : ""}`} onClick={() => setViewMode("grid")} title="Grid view">
                    <ViewModule sx={{ fontSize: 18 }} />
                  </button>
                  <button className={`view-btn${viewMode === "list" ? " active" : ""}`} onClick={() => setViewMode("list")} title="List view">
                    <ViewList sx={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>

              <div className="section-label">
                {search
                  ? `${displayed.length} result${displayed.length !== 1 ? "s" : ""} for "${search}"`
                  : `${totalMovies} movie${totalMovies !== 1 ? "s" : ""} in your list`}
              </div>

              {/* Skeletons */}
              {loading ? (
                viewMode === "grid" ? (
                  <div className="movie-grid">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                ) : (
                  <div className="movie-list">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton skeleton-list-row" />)}
                  </div>
                )
              ) : displayed.length === 0 ? (
                <div className="empty-state fade-up">
                  <Movie className="empty-state-icon" />
                  <Typography sx={{ fontFamily: "var(--font-display)", fontSize: 24, letterSpacing: 2, color: "var(--muted)" }}>
                    {search ? "NO RESULTS FOUND" : "YOUR LIST IS EMPTY"}
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: "var(--muted)" }}>
                    {search ? `No movies matching "${search}"` : "Start adding movies above"}
                  </Typography>
                </div>
              ) : viewMode === "grid" ? (
                <div className="movie-grid">
                  {displayed.map((movie, i) => (
                    <div className="movie-grid-item" key={movie.id}>
                      <MovieCard
                        movie={movie}
                        animDelay={i * 0.04}
                        onDelete={(id) => setMovies((p) => p.filter((m) => m.id !== id))}
                        onEdit={(m) => navigate("/add-movie", { state: { movie: m } })}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="movie-list">
                  {displayed.map((movie, i) => (
                    <MovieListRow
                      key={movie.id}
                      movie={movie}
                      index={i}
                      onDelete={(id) => setMovies((p) => p.filter((m) => m.id !== id))}
                      onEdit={(m) => navigate("/add-movie", { state: { movie: m } })}
                    />
                  ))}
                </div>

              )}

              {!loading && hasMore && !search && (
  <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
    <Button
      onClick={handleLoadMore}
      disabled={loadingMore}
      sx={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        color: "#e0e0e8",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        fontWeight: 500,
        padding: "10px 40px",
        textTransform: "none",
        transition: "all 0.2s",
        "&:hover": {
          background: "var(--raised)",
          borderColor: "rgba(255,255,255,0.18)",
        },
      }}
    >
      {loadingMore ? "Loading…" : "Load more movies"}
    </Button>
  </Box>
)}

{/* All movies loaded message */}
{!loading && !hasMore && totalMovies > MOVIES_PER_PAGE && (
  <Box sx={{ textAlign: "center", mt: 4, mb: 2 }}>
    <Typography sx={{ color: "var(--muted)", fontSize: 13 }}>
      You've seen all {totalMovies} movies
    </Typography>
  </Box>
)}
            </Grid>

          </Grid>
        </Box>
      </Box>
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} navigate={navigate} />}
    </>
  );
}

export default HomePage;
