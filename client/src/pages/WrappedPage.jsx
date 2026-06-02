import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import html2canvas from "html2canvas";
import { Movie, Favorite, SentimentVeryDissatisfied } from "@mui/icons-material";
import { apiFetch, getToken } from "../api";
import logo from "../assets/logo.png";
import "./HomePage.css";
import "./WrappedPage.css";
import {
  buildFacebookUrl,
  buildShareText,
  buildTwitterUrl,
  buildWhatsAppUrl,
  getAppOrigin,
  markWrappedSeen,
} from "../utils/wrappedPeriod";

const PERIODS = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
];

const SLIDES = ["top", "worst", "stats"];

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

function WrappedMovieRow({ movie, rank }) {
  return (
    <div className="wrapped-movie-row">
      <span className="wrapped-movie-rank">{rank}</span>
      {movie.poster_path ? (
        <img
          className="wrapped-movie-poster"
          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
          alt={movie.title}
          crossOrigin="anonymous"
        />
      ) : (
        <div className="wrapped-movie-poster-fallback">
          <Movie sx={{ fontSize: 18 }} />
        </div>
      )}
      <div className="wrapped-movie-info">
        <div className="wrapped-movie-title" title={movie.title}>
          {movie.title}
        </div>
        <div className="wrapped-movie-ratings">
          <span className="rating-chip rating-tmdb" style={{ fontSize: 10 }}>
            TMDB {movie.tmdb_rating ?? "—"}
          </span>
          <span className="rating-chip rating-mine" style={{ fontSize: 10 }}>
            Mine {movie.my_rating}/100
          </span>
        </div>
      </div>
    </div>
  );
}

function BrandFooter({ link }) {
  return (
    <div className="wrapped-brand">
      <img src={logo} alt="Movie Rater" />
      <div>
        <div className="wrapped-brand-text">MOVIE RATER</div>
        <div className="wrapped-brand-link">{link.replace(/^https?:\/\//, "")}</div>
      </div>
    </div>
  );
}

function WrappedPage() {
  useFonts();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = searchParams.get("period") || "month";
  const [period, setPeriod] = useState(
    PERIODS.some((p) => p.id === periodParam) ? periodParam : "month"
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const carouselRef = useRef(null);
  const appLink = `${getAppOrigin()}/wrapped?period=${period}`;

  const loadWrapped = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/movies/wrapped?period=${p}${
          searchParams.get("anchor") === "previous" ? "&anchor=previous" : ""
        }`
      );
      if (!res) return;
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const json = await res.json();
      setData(json);
      if (json.storageKey) markWrappedSeen(json.storageKey);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    loadWrapped(period);
    setSearchParams({ period }, { replace: true });
  }, [period, loadWrapped, navigate, setSearchParams]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const onScroll = () => {
      const w = el.offsetWidth;
      const idx = Math.round(el.scrollLeft / (w + 16));
      setSlide(Math.min(SLIDES.length - 1, Math.max(0, idx)));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [loading, data]);

  function goToSlide(index) {
    const el = carouselRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    el.scrollTo({ left: index * (w + 16), behavior: "smooth" });
    setSlide(index);
  }

  async function downloadPng() {
    const slides = carouselRef.current?.querySelectorAll(".wrapped-capture-target");
    const node = slides?.[slide];
    if (!node || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(node, {
        backgroundColor: "#0f0f12",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `movie-rater-wrapped-${period}-${data?.storageKey || "share"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Could not generate image. Try again or use a screenshot.");
    } finally {
      setDownloading(false);
    }
  }

  const shareText = data ? buildShareText(data, appLink) : "";

  if (loading) {
    return (
      <div className="wrapped-page">
        <div className="wrapped-loading">Loading your wrap…</div>
      </div>
    );
  }

  const top5 = data?.top5 || [];
  const worst5 = data?.worst5 || [];
  const hasMovies = (data?.totalWatched || 0) > 0;

  return (
    <div className="wrapped-page">
      <header className="wrapped-nav">
        <button type="button" className="wrapped-nav-back" onClick={() => navigate("/home")}>
          ← Home
        </button>
        <span style={{ fontFamily: "var(--font-display)", letterSpacing: 2, color: "var(--accent)" }}>
          WRAPPED
        </span>
        <div style={{ width: 72 }} />
      </header>

      <div className="wrapped-period-tabs">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`wrapped-tab ${period === p.id ? "active" : ""}`}
            onClick={() => {
              setPeriod(p.id);
              setSlide(0);
              setSearchParams({ period: p.id });
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="wrapped-hero">
        <h1>{data?.periodLabel || "Your Movie Wrapped"}</h1>
        <p>@{data?.username} · Swipe through your recap</p>
      </div>

      {!hasMovies ? (
        <div className="wrapped-empty">
          <p>No movies in this period yet.</p>
          <p>Add ratings with the correct &quot;watched&quot; month/year, then come back.</p>
          <button type="button" className="wrapped-btn wrapped-btn--primary" style={{ marginTop: 24 }} onClick={() => navigate("/add-movie")}>
            Add a movie
          </button>
        </div>
      ) : (
        <>
          <div className="wrapped-carousel-wrap">
            <div className="wrapped-carousel" ref={carouselRef}>
              <div className="wrapped-slide">
                <div className="wrapped-card wrapped-card--top wrapped-capture-target">
                  <div className="wrapped-card-glow wrapped-card-glow--gold" />
                  <div className="wrapped-card-title">
                    <Favorite sx={{ fontSize: 22, verticalAlign: "middle", marginRight: 6 }} />
                    TOP 5
                  </div>
                  <div className="wrapped-card-sub">{data?.shortLabel}</div>
                  <div className="wrapped-movie-list">
                    {top5.length === 0 && <p className="wrapped-empty">No rated movies</p>}
                    {top5.map((m, i) => (
                      <WrappedMovieRow key={m.id} movie={m} rank={i + 1} />
                    ))}
                  </div>
                  <BrandFooter link={appLink} />
                </div>
              </div>

              <div className="wrapped-slide">
                <div className="wrapped-card wrapped-card--worst wrapped-capture-target">
                  <div className="wrapped-card-glow" style={{ background: "#ff6b6b", top: -40, left: -40 }} />
                  <div className="wrapped-card-title" style={{ color: "#ff8a8a" }}>
                    <SentimentVeryDissatisfied sx={{ fontSize: 22, verticalAlign: "middle", marginRight: 6 }} />
                    WORST 5
                  </div>
                  <div className="wrapped-card-sub">{data?.shortLabel}</div>
                  <div className="wrapped-movie-list">
                    {worst5.length === 0 && <p className="wrapped-empty">No rated movies</p>}
                    {worst5.map((m, i) => (
                      <WrappedMovieRow key={m.id} movie={m} rank={i + 1} />
                    ))}
                  </div>
                  <BrandFooter link={appLink} />
                </div>
              </div>

              <div className="wrapped-slide">
                <div className="wrapped-card wrapped-card--stats wrapped-capture-target">
                  <div className="wrapped-card-glow wrapped-card-glow--teal" />
                  <div className="wrapped-card-title">YOUR STATS</div>
                  <div className="wrapped-card-sub">{data?.shortLabel}</div>
                  <div className="wrapped-stats-grid">
                    <div className="wrapped-stat-box">
                      <div className="wrapped-stat-num">{data?.totalWatched ?? 0}</div>
                      <div className="wrapped-stat-label">Movies watched</div>
                    </div>
                    <div className="wrapped-stat-box">
                      <div className="wrapped-stat-num">{data?.avgRating ?? 0}</div>
                      <div className="wrapped-stat-label">Avg rating / 100</div>
                    </div>
                    <div className="wrapped-stat-box full">
                      <div className="wrapped-stat-num" style={{ fontSize: 28 }}>
                        {data?.topGenre || "—"}
                      </div>
                      <div className="wrapped-stat-label">Most watched genre</div>
                    </div>
                  </div>
                  <BrandFooter link={appLink} />
                </div>
              </div>
            </div>

            <div className="wrapped-dots">
              {SLIDES.map((_, i) => (
                <button
                  key={SLIDES[i]}
                  type="button"
                  className={`wrapped-dot ${slide === i ? "active" : ""}`}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => goToSlide(i)}
                />
              ))}
            </div>

            <div className="wrapped-arrows">
              <button
                type="button"
                className="wrapped-arrow-btn"
                disabled={slide === 0}
                onClick={() => goToSlide(slide - 1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="wrapped-arrow-btn"
                disabled={slide === SLIDES.length - 1}
                onClick={() => goToSlide(slide + 1)}
              >
                ›
              </button>
            </div>
          </div>

          <div className="wrapped-actions">
            <button
              type="button"
              className="wrapped-btn wrapped-btn--primary"
              onClick={downloadPng}
              disabled={downloading}
            >
              {downloading ? "Generating…" : "Download card as PNG"}
            </button>
            <div className="wrapped-actions-row">
              <a
                className="wrapped-btn wrapped-btn--twitter"
                href={buildTwitterUrl(shareText)}
                target="_blank"
                rel="noreferrer"
              >
                Share on X / Twitter
              </a>
              <a
                className="wrapped-btn"
                href={buildFacebookUrl(appLink)}
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
              <a
                className="wrapped-btn wrapped-btn--wa"
                href={buildWhatsAppUrl(shareText)}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", lineHeight: 1.5 }}>
              Instagram: download PNG, then post to Stories. Web Share API can be added later.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default WrappedPage;
