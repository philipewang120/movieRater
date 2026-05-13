import { useEffect, useState } from "react";
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
  ViewModule, ViewList, Sort,
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
      await axios.post(`${import.meta.env.VITE_API_URL}/delete`, { movieId: movie.id }, { withCredentials: true });
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
      await axios.post(`${import.meta.env.VITE_API_URL}/delete`, { movieId: movie.id }, { withCredentials: true });
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

/* ── Main page ── */
function HomePage() {
  useFonts();
  const navigate = useNavigate();
  const [movies,     setMovies]     = useState([]);
  const [email,      setEmail]      = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [searching,  setSearching]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [sortBy,     setSortBy]     = useState("");       // sort key
  const [viewMode,   setViewMode]   = useState("grid");   // "grid" | "list"

  async function fetchMovies(sort = "") {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/movies`, {
        params: sort ? { sort } : {},
        withCredentials: true,
      });
      const d = res.data;
      const raw =
        Array.isArray(d)         ? d        :
        Array.isArray(d?.movies) ? d.movies :
        Array.isArray(d?.data)   ? d.data   : [];

      const normalized = raw.map((m) => ({
        id:           m.id           ?? m._id          ?? Math.random(),
        tmdb_id:      m.tmdb_id      ?? m.tmdbId       ?? m.movie_id ?? m.id,
        title:        m.title        ?? m.name         ?? "Untitled",
        poster_path:  m.poster_path  ?? m.posterPath   ?? m.poster   ?? null,
        tmdb_rating:  m.tmdb_rating  ?? m.tmdbRating   ?? m.vote_average ?? null,
        my_rating:    Number(m.my_rating ?? m.myRating ?? m.rating   ?? 50),
        remarks:      m.remarks      ?? m.comment      ?? m.notes    ?? "",
        release_date: m.release_date ?? m.releaseDate  ?? "",
        watched_month:m.watched_month ?? null,
        watched_year: m.watched_year  ?? null,
      }));

      setMovies(normalized);
      setProfilePic(d?.profile_pic ?? d?.profilePic ?? d?.avatar ?? "");
      setEmail(d?.email ? d.email.split("@")[0] : "user");
    } catch (err) {
      console.log("fetchMovies error:", err?.response?.status);
    } finally {
      setLoading(false);
    }
  }

  function handleSortChange(newSort) {
    setSortBy(newSort);
    fetchMovies(newSort);
  }

  async function handleAddMovie() {
    if (!movieTitle.trim()) return;
    setSearching(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/movie/${movieTitle}`, { withCredentials: true });
      navigate("/add-movie", { state: { movie: res.data } });
    } catch {
      toast("Movie not found. Try a different title.", "error");
    } finally {
      setSearching(false);
    }
  }

  async function handleLogout() {
    try { await axios.post(`${import.meta.env.VITE_API_URL}/api/logout`, {}, { withCredentials: true }); } catch (_) {}
    navigate("/login");
  }

  useEffect(() => { fetchMovies(); }, []);

  const safeMovies = Array.isArray(movies) ? movies : [];
  const best       = [...safeMovies].sort((a, b) => b.my_rating - a.my_rating).slice(0, 5);
  const worst      = [...safeMovies].sort((a, b) => a.my_rating - b.my_rating).slice(0, 5);
  const displayed  = search.trim()
    ? safeMovies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
    : safeMovies;
  const avgRating  = safeMovies.length ? (safeMovies.reduce((s, m) => s + m.my_rating, 0) / safeMovies.length).toFixed(0) : 0;
  const topRated   = safeMovies.length ? [...safeMovies].sort((a, b) => b.my_rating - a.my_rating)[0] : null;
  const initial    = email.charAt(0).toUpperCase();

  return (
    <>
      
      <ToastContainer />
      <Box sx={{ minHeight: "100vh", bgcolor: "var(--ink)" }}>

        {/* NAVBAR */}
        <AppBar position="sticky" className="nav-bar" elevation={0}>
          <Toolbar sx={{ px: { xs: 2, md: 4 }, gap: 2, minHeight: "68px !important" }}>
            <Box className="nav-logo" onClick={() => navigate("/")}>
              <div className="logo-icon"><Movie sx={{ fontSize: 20 }} /></div>
              MOVIE RATER
            </Box>
            <Box sx={{ flex: 1 }} />
            <Box className="search-wrap">
              <Search sx={{ color: "var(--muted)", fontSize: 18 }} />
              <input placeholder="Search your movies…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </Box>
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" spacing={1.5} alignItems="center">
              {profilePic
                ? <Avatar src={profilePic} className="nav-user-avatar" sx={{ width: 40, height: 40 }} />
                : <div className="nav-avatar-initials">{initial}</div>
              }
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
                    <SideList title="Favorites"   movies={best}  />
                    <SideList title="Worst Watch" movies={worst} worst />
                    <TmdbTopRated />
                    <SocialWidget />
                  </Stack>
                </Box>
              </div>
            </Grid>

            {/* CENTER */}
            <Grid item xs={12} sx={{ flex: { md: "1 1 0" }, minWidth: 0, overflow: "hidden" }}>

              {/* Stat bar */}
              {!loading && safeMovies.length > 0 && (
                <div className="stat-bar fade-up">
                  <div className="stat-item">
                    <span className="stat-num">{safeMovies.length}</span>
                    <span className="stat-label">movies</span>
                  </div>
                  <div className="stat-divider" />
                  <div className="stat-item">
                    <span className="stat-num">{avgRating}</span>
                    <span className="stat-label">avg score</span>
                  </div>
                  {topRated && (
                    <>
                      <div className="stat-divider" />
                      <div className="stat-item" style={{ minWidth: 0, overflow: "hidden" }}>
                        <span style={{ fontSize: 13, color: "var(--accent2)", fontFamily: "var(--font-body)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {topRated.title}
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
                  : `${safeMovies.length} movie${safeMovies.length !== 1 ? "s" : ""} watched`}
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
            </Grid>

          </Grid>
        </Box>
      </Box>
    </>
  );
}

export default HomePage;
