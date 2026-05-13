import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { ArrowBack, Movie, Star, Edit } from "@mui/icons-material";

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

const STYLES = `
  :root {
    --ink:          #0f0f12;
    --surface:      #16161c;
    --card:         #1e1e27;
    --raised:       #26262f;
    --accent:       #e8c547;
    --accent2:      #5de8c5;
    --muted:        #6b6b7a;
    --border:       rgba(255,255,255,0.07);
    --radius-lg:    18px;
    --radius-md:    12px;
    --font-display: 'Bebas Neue', sans-serif;
    --font-body:    'DM Sans', sans-serif;
    --transition:   0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--ink); font-family: var(--font-body); color: #e0e0e8; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--raised); border-radius: 4px; }

  /* ── PAGE ── */
  .am-page {
    min-height: 100vh;
    background: var(--ink);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  /* teal glow */
  .am-page::before {
    content: '';
    position: fixed;
    top: -10%;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 500px;
    background: radial-gradient(ellipse, rgba(93,232,197,0.04) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── TOP BAR ── */
  .am-topbar {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    padding: 0 48px;
    height: 68px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 1px 24px rgba(0,0,0,0.5);
    gap: 16px;
    flex-shrink: 0;
  }

  .am-logo {
    font-family: var(--font-display);
    font-size: 26px;
    letter-spacing: 2px;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: opacity var(--transition);
    text-decoration: none;
  }
  .am-logo:hover { opacity: 0.8; }

  .am-logo-icon {
    width: 34px;
    height: 34px;
    background: var(--accent);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink);
    flex-shrink: 0;
  }

  .am-back-btn {
    background: var(--raised) !important;
    color: var(--muted) !important;
    border: 1px solid var(--border) !important;
    border-radius: 10px !important;
    text-transform: none !important;
    font-family: var(--font-body) !important;
    font-size: 13px !important;
    padding: 6px 14px !important;
    margin-left: auto !important;
    transition: background var(--transition), color var(--transition) !important;
  }
  .am-back-btn:hover {
    background: #2e2e3a !important;
    color: #e0e0e8 !important;
    border-color: rgba(255,255,255,0.18) !important;
  }

  /* ── BODY ── */
  .am-body {
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 48px 24px 64px;
    position: relative;
    z-index: 1;
  }

  /* ── CARD ── */
  .am-card {
    width: 100%;
    max-width: 860px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex;
    animation: fadeUp 0.45s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    .am-card { flex-direction: column; }
    .am-topbar { padding: 0 20px; }
  }

  /* ── POSTER PANEL ── */
  .am-poster-panel {
    width: 280px;
    flex-shrink: 0;
    position: relative;
    background: var(--raised);
  }

  @media (max-width: 768px) {
    .am-poster-panel { width: 100%; height: 300px; }
  }

  .am-poster {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .am-poster-fallback {
    width: 100%;
    height: 100%;
    min-height: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--muted);
  }

  .am-mode-badge {
    position: absolute;
    top: 14px;
    left: 14px;
    background: var(--accent);
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 12px;
    letter-spacing: 2px;
    padding: 4px 10px;
    border-radius: 6px;
  }

  /* ── FORM PANEL ── */
  .am-form-panel {
    flex: 1;
    padding: 36px 40px 40px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  @media (max-width: 768px) {
    .am-form-panel { padding: 24px 20px 28px; }
  }

  .am-eyebrow {
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 4px;
    color: var(--accent2);
    margin-bottom: 8px;
  }

  .am-title {
    font-family: var(--font-display) !important;
    font-size: clamp(28px, 4vw, 40px) !important;
    letter-spacing: 1px !important;
    color: #f0f0f5 !important;
    line-height: 1.1 !important;
    margin-bottom: 4px !important;
  }

  .am-meta {
    font-size: 13px !important;
    color: var(--muted) !important;
    margin-bottom: 32px !important;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .am-tmdb-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(93,232,197,0.12);
    color: var(--accent2);
    border: 1px solid rgba(93,232,197,0.2);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
  }

  /* ── TEXT FIELD OVERRIDES ── */
  .am-field .MuiInputBase-input {
    color: #e0e0e8 !important;
    font-family: var(--font-body) !important;
    font-size: 14px !important;
  }
  .am-field .MuiInputLabel-root {
    color: var(--muted) !important;
    font-family: var(--font-body) !important;
    font-size: 14px !important;
  }
  .am-field .MuiInputLabel-root.Mui-focused { color: var(--accent2) !important; }
  .am-field .MuiOutlinedInput-root fieldset {
    border-color: var(--border) !important;
    border-radius: 12px !important;
    transition: border-color var(--transition) !important;
  }
  .am-field .MuiOutlinedInput-root:hover fieldset { border-color: rgba(255,255,255,0.18) !important; }
  .am-field .MuiOutlinedInput-root.Mui-focused fieldset {
    border-color: var(--accent2) !important;
    box-shadow: 0 0 0 3px rgba(93,232,197,0.10) !important;
  }

  /* ── MONTH/YEAR ROW ── */
  .am-date-row {
    display: flex;
    gap: 12px;
  }
  .am-date-row > * { flex: 1; }

  /* ── RATING PREVIEW ── */
  .am-rating-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: -4px;
    margin-bottom: 4px;
  }

  .am-rating-bar {
    flex: 1;
    height: 4px;
    background: var(--raised);
    border-radius: 4px;
    overflow: hidden;
  }

  .am-rating-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease, background 0.3s ease;
  }

  .am-rating-label {
    font-size: 12px;
    font-weight: 600;
    min-width: 36px;
    text-align: right;
  }

  /* ── SUBMIT ── */
  .am-submit {
    background: var(--accent) !important;
    color: var(--ink) !important;
    border-radius: 12px !important;
    height: 50px !important;
    font-family: var(--font-body) !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    text-transform: none !important;
    transition: background var(--transition), transform var(--transition) !important;
    margin-top: 8px !important;
  }
  .am-submit:hover { background: #f0d050 !important; transform: scale(1.02); }
  .am-submit:disabled { opacity: 0.6 !important; }

  /* ── ERROR ── */
  .am-error {
    background: rgba(255,80,80,0.1);
    border: 1px solid rgba(255,80,80,0.25);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: #ff6b6b;
    margin-bottom: 16px;
    text-align: center;
  }
`;

/* Rating colour helper */
function ratingColor(r) {
  if (r >= 80) return "#5de8c5";
  if (r >= 60) return "#e8c547";
  if (r >= 40) return "#f4a261";
  return "#ff6b6b";
}

function ratingLabel(r) {
  if (!r) return "";
  if (r >= 80) return "Loved it";
  if (r >= 60) return "Pretty good";
  if (r >= 40) return "Meh";
  return "Didn't like it";
}

function AddMoviePage() {
  useFonts();
  const location = useLocation();
  const navigate = useNavigate();

  // ── Normalise incoming state ─────────────────────────────────────────────
  // Add flow:  navigate("/add-movie", { state: { movie: tmdbResult } })
  // Edit flow: navigate("/add-movie", { state: { movie: userMovie } })
  //            where userMovie already has id, my_rating, remarks, etc.
  const incoming = location.state?.movie;

  // Determine mode: if the movie already has my_rating it came from the DB (edit)
  const isEdit = incoming && (incoming.my_rating !== undefined);
  const displayMovie = incoming;

  const currentDate = new Date();

  const [myRating,     setMyRating]     = useState(isEdit ? String(incoming.my_rating) : "");
  const [remarks,      setRemarks]      = useState(isEdit ? (incoming.remarks ?? "") : "");
  const [watchedMonth, setWatchedMonth] = useState(isEdit ? (incoming.watched_month ?? currentDate.getMonth() + 1) : currentDate.getMonth() + 1);
  const [watchedYear,  setWatchedYear]  = useState(isEdit ? (incoming.watched_year  ?? currentDate.getFullYear()) : currentDate.getFullYear());
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  /* Nothing passed — redirect cleanly */
  if (!displayMovie) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="am-page">
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <Movie sx={{ fontSize: 64, color: "var(--muted)", opacity: 0.3 }} />
            <Typography sx={{ fontFamily: "var(--font-display)", fontSize: 28, letterSpacing: 2, color: "var(--muted)" }}>
              NO MOVIE SELECTED
            </Typography>
            <Button className="am-back-btn" sx={{ mt: 1 }} onClick={() => navigate("/home")}>
              Back to home
            </Button>
          </Box>
        </div>
      </>
    );
  }

  async function handleSubmit() {
    if (!myRating) { setError("Please enter a rating."); return; }
    const rating = Number(myRating);
    if (rating < 1 || rating > 100) { setError("Rating must be between 1 and 100."); return; }

    setError("");
    setLoading(true);

    try {
      if (isEdit) {
        await axios.post(
          "http://localhost:3000/edit",
          {
            movieId:      incoming.id,
            my_rating:    rating,
            remarks,
            watched_month: Number(watchedMonth),
            watched_year:  Number(watchedYear),
          },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          "http://localhost:3000/add",
          {
            movie_id:    displayMovie.id,
            title:       displayMovie.title,
            poster_path: displayMovie.poster_path,
            tmdb_rating: displayMovie.vote_average ?? displayMovie.tmdb_rating,
            release_date:displayMovie.release_date,
            remarks,
            my_rating:    rating,
            watched_month: Number(watchedMonth),
            watched_year:  Number(watchedYear),
          },
          { withCredentials: true }
        );
      }
      navigate("/home");
    } catch (err) {
      console.log("Submit error:", err);
      setError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const ratingNum = Number(myRating) || 0;

  return (
    <>
      <style>{STYLES}</style>

      <div className="am-page">

        {/* ── TOP BAR ── */}
        <nav className="am-topbar">
          <div className="am-logo" onClick={() => navigate("/")}>
            <div className="am-logo-icon"><Movie sx={{ fontSize: 18 }} /></div>
            MOVIE RATER
          </div>

          <Button className="am-back-btn" startIcon={<ArrowBack sx={{ fontSize: 15 }} />} onClick={() => navigate("/home")}>
            Back to home
          </Button>
        </nav>

        {/* ── BODY ── */}
        <div className="am-body">
          <div className="am-card">

            {/* ── POSTER ── */}
            <div className="am-poster-panel">
              {displayMovie.poster_path ? (
                <img
                  className="am-poster"
                  src={`https://image.tmdb.org/t/p/w500${displayMovie.poster_path}`}
                  alt={displayMovie.title}
                />
              ) : (
                <div className="am-poster-fallback">
                  <Movie sx={{ fontSize: 56, color: "var(--muted)", opacity: 0.4 }} />
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>No poster</span>
                </div>
              )}
              <div className="am-mode-badge">{isEdit ? "EDITING" : "NEW"}</div>
            </div>

            {/* ── FORM ── */}
            <div className="am-form-panel">

              <div className="am-eyebrow">{isEdit ? "UPDATE YOUR REVIEW" : "LOG THIS MOVIE"}</div>

              <Typography className="am-title">{displayMovie.title}</Typography>

              <div className="am-meta">
                {displayMovie.release_date && (
                  <span>{displayMovie.release_date.slice(0, 4)}</span>
                )}
                {(displayMovie.vote_average || displayMovie.tmdb_rating) && (
                  <span className="am-tmdb-chip">
                    <Star sx={{ fontSize: 11 }} />
                    TMDB {(displayMovie.vote_average ?? displayMovie.tmdb_rating)?.toFixed?.(1) ?? (displayMovie.vote_average ?? displayMovie.tmdb_rating)}
                  </span>
                )}
              </div>

              {error && <div className="am-error">{error}</div>}

              <Stack spacing={2.5}>

                {/* Rating */}
                <Box>
                  <TextField
                    className="am-field"
                    label="Your Rating (1 – 100)"
                    type="number"
                    value={myRating}
                    onChange={(e) => { setError(""); setMyRating(e.target.value); }}
                    fullWidth
                    inputProps={{ min: 1, max: 100 }}
                  />
                  {ratingNum > 0 && (
                    <div className="am-rating-preview" style={{ marginTop: 8 }}>
                      <div className="am-rating-bar">
                        <div
                          className="am-rating-fill"
                          style={{ width: `${Math.min(ratingNum, 100)}%`, background: ratingColor(ratingNum) }}
                        />
                      </div>
                      <span className="am-rating-label" style={{ color: ratingColor(ratingNum) }}>
                        {ratingLabel(ratingNum)}
                      </span>
                    </div>
                  )}
                </Box>

                {/* Comments */}
                <TextField
                  className="am-field"
                  label="Your thoughts…"
                  multiline
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  fullWidth
                  placeholder="What did you think? Would you recommend it?"
                />

                {/* Month / Year */}
                <div className="am-date-row">
                  <TextField
                    className="am-field"
                    label="Month watched"
                    type="number"
                    value={watchedMonth}
                    onChange={(e) => setWatchedMonth(e.target.value)}
                    inputProps={{ min: 1, max: 12 }}
                  />
                  <TextField
                    className="am-field"
                    label="Year watched"
                    type="number"
                    value={watchedYear}
                    onChange={(e) => setWatchedYear(e.target.value)}
                    inputProps={{ min: 1900, max: 2100 }}
                  />
                </div>

                {/* Submit */}
                <Button
                  className="am-submit"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={isEdit ? <Edit sx={{ fontSize: 18 }} /> : <Star sx={{ fontSize: 18 }} />}
                >
                  {loading
                    ? (isEdit ? "Updating…" : "Adding…")
                    : (isEdit ? "Update movie" : "Add to my list")}
                </Button>

              </Stack>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default AddMoviePage;
