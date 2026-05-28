
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  InputBase,
  Paper,
  Typography,
  Stack,
} from "@mui/material";

import {
  Add,
  Movie,
  Favorite,
  SentimentVeryDissatisfied,
  SentimentNeutral,
} from "@mui/icons-material";

import axios from "axios";
import "./LandingPage.css";
import logo from "../assets/logo.png";

/* ─── Inject Google Fonts ─── */
function useFonts() {
  useEffect(() => {
    const id = "gfonts-cinemalist";

    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";

    link.href =
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap";

    document.head.appendChild(link);
  }, []);
}

/* ─── Feature cards ─── */
const FEATURES = [
  {
    icon: <Movie sx={{ fontSize: 22 }} />,
    title: "BUILD YOUR INDEX",
    desc: "Search any movie and add it to your personal watchlist in seconds. Powered by TMDB.",
  },
  {
    icon: <Favorite sx={{ fontSize: 22 }} />,
    title: "RATE YOUR EXPERIENCE",
    desc: "Score every film on your own scale. Track your taste over time with mood-based emojis.",
  },
  {
    icon: <SentimentNeutral sx={{ fontSize: 22 }} />,
    title: "REFLECT & REVISIT",
    desc: "Leave comments, see your best and worst watches at a glance in the sidebar.",
  },
];

/* ─── Mood icon helper ─── */
function MoodIcon({ mood, size = 16 }) {
  if (mood === "love") {
    return <Favorite sx={{ fontSize: size, color: "#ff6b6b" }} />;
  }

  if (mood === "bad") {
    return (
      <SentimentVeryDissatisfied
        sx={{ fontSize: size, color: "#ff6b6b" }}
      />
    );
  }

  return (
    <SentimentNeutral
      sx={{ fontSize: size, color: "#e8c547" }}
    />
  );
}

/* ─── Generate fake mood from TMDB rating ─── */
function getMood(vote) {
  if (vote >= 7.5) return "love";
  if (vote >= 6) return "neutral";
  return "bad";
}

function LandingPage() {
  useFonts();

  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [movieTitle, setMovieTitle] = useState("");

  /* ─── Redirect logged-in users ─── */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (payload.exp * 1000 > Date.now()) {
          navigate("/home");
        }
      } catch (_) {}
    }
  }, [navigate]);

  /* ─── Fetch random TMDB movies ─── */
  useEffect(() => {
    async function fetchMovies() {
      try {
  const res = await axios.get( "https://api.themoviedb.org/3/discover/movie", 
    { withCredentials: false, 
      headers: { Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`, }, 
      params: { language: "en-US", 
                sort_by: "popularity.desc", 
                include_adult: false, 
                page: Math.floor(Math.random() * 10) + 1, },
              
        } );

        const results = res.data.results || [];

        /* Randomize and take 6 */
        const shuffled = [...results]
          .sort(() => 0.5 - Math.random())
          .slice(0, 6);

        setMovies(shuffled);
      } catch (err) {
        console.error("TMDB fetch failed:", err);
      }
    }

    fetchMovies();
  }, []);

  /* ─── Add button handler ─── */
  function handleAdd() {
    if (!movieTitle.trim()) return;

    navigate("/register");
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "var(--ink)" }}>
      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-logo" onClick={() => navigate("/")}>
          <div className="lp-logo-icon">
            <Movie sx={{ fontSize: 20 }} />
          </div>

          MOVIE RATER
        </div>

        <div className="lp-nav-btns">
          <Button
            className="lp-btn-ghost"
            onClick={() => navigate("/login")}
          >
            Log in
          </Button>

          <Button
            className="lp-btn-solid"
            onClick={() => navigate("/register")}
          >
            Get started
          </Button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-eyebrow">
          YOUR PERSONAL MOVIE ARCHIVE
        </div>

        <Typography className="lp-hero-title">
          Every film you've
          <br />
          watched, <span>ranked.</span>
        </Typography>

        <Typography className="lp-hero-sub">
          Search any movie, rate it, leave a comment.
          Build the only list that matters — yours.
        </Typography>

        {/* Add bar */}
        <div className="lp-add-bar">
          <Paper className="lp-add-paper" elevation={0}>
            <InputBase
              fullWidth
              placeholder="What did you watch? Search a title…"
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleAdd()
              }
              sx={{
                color: "#e0e0e8",
                fontSize: 15,
                fontFamily: "var(--font-body)",
              }}
            />

            <Button
              className="lp-add-btn"
              startIcon={<Add />}
              onClick={handleAdd}
            >
              Add
            </Button>
          </Paper>

          <Typography className="lp-add-hint">
            No account yet? You'll be prompted to register
            — it's free.
          </Typography>
        </div>

        {/* Stats */}
        <div className="lp-stats">
          {[
            { num: "10K+", label: "Movies indexed" },
            { num: "5K+", label: "Users" },
            { num: "1M+", label: "Ratings given" },
          ].map((s) => (
            <div className="lp-stat-item" key={s.label}>
              <div className="lp-stat-num">{s.num}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <hr className="lp-divider" />

      {/* ── RECENTLY INDEXED ── */}
      <section className="lp-section">
        <div className="lp-section-eyebrow">
          EXPLORE
        </div>

        <Typography className="lp-section-title">
          Recently indexed
        </Typography>

        <div className="lp-cards-row">
          {movies.map((movie) => {
            const posterUrl = movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : null;

            return (
              <div
                className="lp-movie-card"
                key={movie.id}
              >
                <div className="lp-card-poster-wrap">
                  {!posterUrl && (
                    <div className="lp-card-poster-placeholder">
                      <Movie
                        sx={{
                          fontSize: 36,
                          color: "var(--muted)",
                        }}
                      />

                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                        }}
                      >
                        No poster
                      </span>
                    </div>
                  )}

                  {posterUrl && (
                    <img
                      src={posterUrl}
                      alt={movie.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}

                  <div className="lp-card-emoji">
                    <MoodIcon
                      mood={getMood(movie.vote_average)}
                      size={15}
                    />
                  </div>
                </div>

                <div className="lp-card-info">
                  <div
                    className="lp-card-title"
                    title={movie.title}
                  >
                    {movie.title}
                  </div>

                  <div className="lp-card-chips">
                    <span className="lp-chip lp-chip-tmdb">
                      TMDB{" "}
                      {movie.vote_average?.toFixed(1)}
                    </span>

                    <span className="lp-chip lp-chip-mine">
                      {movie.release_date?.slice(0, 4)}
                    </span>
                  </div>

                  {movie.overview && (
                    <div className="lp-card-remarks">
                      {movie.overview.slice(0, 90)}...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <hr className="lp-divider" />

      {/* ── FEATURES ── */}
      <section className="lp-section">
        <div className="lp-section-eyebrow">
          WHY MOVIE RATER
        </div>

        <Typography className="lp-section-title">
          Built for film lovers
        </Typography>

        <div className="lp-features-grid">
          {FEATURES.map((f) => (
            <div
              className="lp-feature-card"
              key={f.title}
            >
              <div className="lp-feature-icon">
                {f.icon}
              </div>

              <div className="lp-feature-title">
                {f.title}
              </div>

              <div className="lp-feature-desc">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="lp-divider" />

      {/* ── CTA ── */}
      <section className="lp-cta">
        <Typography className="lp-cta-title">
          Start your list today
        </Typography>

        <Typography className="lp-cta-sub">
          Free to use. No credit card required. Just
          movies.
        </Typography>

        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
        >
          <Button
            className="lp-btn-solid"
            onClick={() => navigate("/register")}
            sx={{
              px: "32px !important",
              py: "12px !important",
              fontSize: "15px !important",
            }}
          >
            Create free account
          </Button>

          <Button
            className="lp-btn-ghost"
            onClick={() => navigate("/login")}
            sx={{
              px: "32px !important",
              py: "12px !important",
              fontSize: "15px !important",
            }}
          >
            I already have one
          </Button>
        </Stack>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-logo" onClick={() => navigate("/")}>
          <div className="lp-logo-icon">
            <Movie sx={{ fontSize: 18 }} />
          </div>

          MOVIE RATER
        </div>

        <Typography className="lp-footer-copy">
          © {new Date().getFullYear()} Movie Rater.
          All rights reserved.
        </Typography>
      </footer>
    </Box>
  );
}

export default LandingPage;

