import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, getToken, deleteToken } from "../api";
import {
  Box, Button, Stack, Typography, Avatar, Tooltip,
} from "@mui/material";
import {
  Movie, Star, Favorite, Settings, ArrowBack,
  Lock, Person, Edit, TrendingUp, AccessTime, 
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
  .prof-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 68px;
    background: var(--surface); border-bottom: 1px solid var(--border);
    box-shadow: 0 1px 24px rgba(0,0,0,0.5);
  }
  @media (max-width: 600px) { .prof-nav { padding: 0 20px; } }

  .prof-logo {
    font-family: var(--font-display); font-size: 26px; letter-spacing: 2px;
    color: var(--accent); display: flex; align-items: center; gap: 8px;
    cursor: pointer; transition: opacity var(--transition);
  }
  .prof-logo:hover { opacity: 0.8; }
  .prof-logo-icon {
    width: 34px; height: 34px; background: var(--accent); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; color: var(--ink);
  }

  .prof-nav-actions { display: flex; gap: 10px; align-items: center; }

  .prof-nav-btn {
    background: var(--raised) !important; color: var(--muted) !important;
    border: 1px solid var(--border) !important; border-radius: 10px !important;
    text-transform: none !important; font-family: var(--font-body) !important;
    font-size: 13px !important; padding: 6px 14px !important;
    transition: all var(--transition) !important;
  }
  .prof-nav-btn:hover {
    background: #2e2e3a !important; color: #e0e0e8 !important;
    border-color: rgba(255,255,255,0.18) !important;
  }

  /* PAGE */
  .prof-page { min-height: 100vh; background: var(--ink); }

  /* COVER */
  .prof-cover {
    height: 180px;
    background: linear-gradient(135deg, #1a1a24 0%, #0f0f12 50%, #1a1824 100%);
    position: relative; overflow: hidden;
  }
  .prof-cover::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(232,197,71,0.08) 0%, transparent 60%),
                radial-gradient(ellipse at 70% 50%, rgba(93,232,197,0.06) 0%, transparent 60%);
  }
  .prof-cover-pattern {
    position: absolute; inset: 0; opacity: 0.03;
    background-image: repeating-linear-gradient(
      45deg, #fff 0px, #fff 1px, transparent 1px, transparent 12px
    );
  }

  /* HEADER */
  .prof-header {
    max-width: 960px; margin: 0 auto;
    padding: 0 32px; position: relative;
  }
  @media (max-width: 600px) { .prof-header { padding: 0 20px; } }

  .prof-avatar-wrap {
    position: absolute; top: -56px; left: 32px;
  }
  @media (max-width: 600px) { .prof-avatar-wrap { left: 20px; } }

  .prof-avatar {
    width: 112px !important; height: 112px !important;
    border: 4px solid var(--ink) !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
    font-size: 40px !important;
    background: var(--raised) !important;
    font-family: var(--font-display) !important;
  }

  .prof-header-info {
    padding-top: 68px; padding-bottom: 24px;
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
  }

  .prof-username {
    font-family: var(--font-display);
    font-size: 36px; letter-spacing: 2px; color: #f0f0f5;
    line-height: 1;
  }

  .prof-bio {
    font-size: 14px; color: var(--muted); margin-top: 6px; max-width: 480px;
  }

  .prof-meta {
    display: flex; gap: 20px; margin-top: 10px; flex-wrap: wrap;
  }

  .prof-meta-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; color: var(--muted); cursor: pointer;
    transition: color var(--transition);
  }
  .prof-meta-item:hover { color: #e0e0e8; }
  .prof-meta-num {
    font-family: var(--font-display); font-size: 18px; color: var(--accent);
  }

  .prof-privacy-badge {
    display: inline-flex; align-items: center; gap: 4px;
    background: rgba(107,107,122,0.15); border: 1px solid var(--border);
    border-radius: 20px; font-size: 11px; color: var(--muted);
    padding: 3px 10px; margin-top: 8px;
  }

  /* FOLLOW BTN */
  .prof-follow-btn {
    background: var(--accent) !important; color: var(--ink) !important;
    border-radius: 10px !important; font-family: var(--font-body) !important;
    font-weight: 700 !important; font-size: 14px !important;
    text-transform: none !important; padding: 8px 24px !important;
    transition: all var(--transition) !important;
    flex-shrink: 0;
  }
  .prof-follow-btn:hover { background: #f0d050 !important; transform: scale(1.03); }

  .prof-unfollow-btn {
    background: transparent !important; color: var(--muted) !important;
    border: 1px solid var(--border) !important; border-radius: 10px !important;
    font-family: var(--font-body) !important; font-size: 14px !important;
    text-transform: none !important; padding: 8px 24px !important;
    transition: all var(--transition) !important; flex-shrink: 0;
  }
  .prof-unfollow-btn:hover {
    border-color: #ff6b6b !important; color: #ff6b6b !important;
  }

  .prof-edit-btn {
    background: var(--raised) !important; color: #e0e0e8 !important;
    border: 1px solid var(--border) !important; border-radius: 10px !important;
    font-family: var(--font-body) !important; font-size: 14px !important;
    text-transform: none !important; padding: 8px 20px !important;
    transition: all var(--transition) !important; flex-shrink: 0;
  }
  .prof-edit-btn:hover {
    background: #2e2e3a !important; border-color: rgba(255,255,255,0.18) !important;
  }

  /* DIVIDER */
  .prof-divider { border: none; border-top: 1px solid var(--border); }

  /* BODY */
  .prof-body {
    max-width: 960px; margin: 0 auto;
    padding: 32px 32px 64px;
  }
  @media (max-width: 600px) { .prof-body { padding: 24px 20px 48px; } }

  /* STATS */
  .prof-stats {
    display: flex; gap: 0;
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 32px;
  }

  .prof-stat {
    flex: 1; padding: 20px 24px; text-align: center;
    border-right: 1px solid var(--border);
  }
  .prof-stat:last-child { border-right: none; }

  .prof-stat-num {
    font-family: var(--font-display); font-size: 32px;
    color: var(--accent); letter-spacing: 1px;
  }
  .prof-stat-label {
    font-size: 11px; color: var(--muted); letter-spacing: 2px;
    text-transform: uppercase; margin-top: 2px;
  }

  /* SECTION */
  .prof-section { margin-bottom: 32px; }

  .prof-section-header {
    display: flex; align-items: center; gap: 8px;
    font-family: var(--font-display); font-size: 18px;
    letter-spacing: 2px; color: #f0f0f5; margin-bottom: 16px;
  }
  .prof-section-icon { color: var(--accent2); }

  /* MOVIE CARDS ROW */
  .prof-movies-row {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
  }
  @media (max-width: 600px) {
    .prof-movies-row { grid-template-columns: 1fr; }
  }

  .prof-movie-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-md); overflow: hidden;
    transition: transform var(--transition), border-color var(--transition);
    text-decoration: none; display: block;
  }
  .prof-movie-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255,255,255,0.14);
  }

  .prof-movie-poster {
    width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block;
    background: var(--raised);
  }
  .prof-movie-poster-fallback {
    width: 100%; aspect-ratio: 2/3; background: var(--raised);
    display: flex; align-items: center; justify-content: center;
  }
  .prof-movie-info { padding: 12px; }
  .prof-movie-title {
    font-size: 13px; font-weight: 600; color: #f0f0f5;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 6px;
  }
  .prof-movie-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .prof-chip {
    font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px;
  }
  .prof-chip-mine {
    background: rgba(232,197,71,0.12); color: var(--accent);
    border: 1px solid rgba(232,197,71,0.2);
  }
  .prof-chip-tmdb {
    background: rgba(93,232,197,0.12); color: var(--accent2);
    border: 1px solid rgba(93,232,197,0.2);
  }

  /* ACTIVITY */
  .prof-activity-list { display: flex; flex-direction: column; gap: 10px; }

  .prof-activity-item {
    display: flex; align-items: center; gap: 14px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-md); padding: 14px 16px;
    transition: border-color var(--transition);
  }
  .prof-activity-item:hover { border-color: rgba(255,255,255,0.12); }

  .prof-activity-poster {
    width: 40px; height: 56px; object-fit: cover;
    border-radius: 6px; flex-shrink: 0; background: var(--raised);
    display: flex; align-items: center; justify-content: center;
  }

  .prof-activity-info { flex: 1; min-width: 0; }
  .prof-activity-title {
    font-size: 14px; font-weight: 600; color: #f0f0f5;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .prof-activity-meta { font-size: 12px; color: var(--muted); margin-top: 2px; }

  .prof-activity-type {
    font-size: 10px; font-weight: 700; letter-spacing: 1px;
    padding: 3px 8px; border-radius: 20px; flex-shrink: 0;
    text-transform: uppercase;
  }
  .type-added   { background: rgba(93,232,197,0.12); color: var(--accent2); border: 1px solid rgba(93,232,197,0.2); }
  .type-edited  { background: rgba(232,197,71,0.12);  color: var(--accent);  border: 1px solid rgba(232,197,71,0.2); }
  .type-deleted { background: rgba(255,107,107,0.12); color: #ff6b6b;        border: 1px solid rgba(255,107,107,0.2); }

  /* LOCKED */
  .prof-locked {
    text-align: center; padding: 64px 24px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }
  .prof-locked-icon {
    width: 64px; height: 64px; background: var(--raised);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
  }

  /* LOADING */
  .prof-loading {
    min-height: 60vh; display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 16px;
  }
  .prof-spinner {
    width: 40px; height: 40px; border-radius: 50%;
    border: 3px solid var(--border); border-top-color: var(--accent);
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* FOLLOWERS MODAL */
  .prof-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; padding: 24px;
  }
  .prof-modal {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-lg); width: 100%; max-width: 400px;
    max-height: 80vh; display: flex; flex-direction: column;
    animation: fadeUp 0.3s ease both;
  }
  .prof-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px; border-bottom: 1px solid var(--border);
  }
  .prof-modal-title {
    font-family: var(--font-display); font-size: 20px; letter-spacing: 1px;
  }
  .prof-modal-close {
    background: none; border: none; color: var(--muted); cursor: pointer;
    font-size: 20px; padding: 4px; transition: color var(--transition);
  }
  .prof-modal-close:hover { color: #e0e0e8; }
  .prof-modal-list { overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .prof-modal-user {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px; border-radius: var(--radius-md);
    cursor: pointer; transition: background var(--transition);
    text-decoration: none;
  }
  .prof-modal-user:hover { background: var(--raised); }
  .prof-modal-username { font-size: 14px; font-weight: 600; color: #f0f0f5; }
`;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function FollowersModal({ title, userId, type, onClose, onNavigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/${type}/${userId}`)
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [userId, type]);

  return (
    <div className="prof-modal-overlay" onClick={onClose}>
      <div className="prof-modal" onClick={e => e.stopPropagation()}>
        <div className="prof-modal-header">
          <span className="prof-modal-title">{title}</span>
          <button className="prof-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="prof-modal-list">
          {loading && <Typography sx={{ color: "var(--muted)", fontSize: 14, textAlign: "center", py: 2 }}>Loading…</Typography>}
          {!loading && users.length === 0 && <Typography sx={{ color: "var(--muted)", fontSize: 14, textAlign: "center", py: 2 }}>Nobody here yet</Typography>}
          {users.map(u => (
            <div key={u.id} className="prof-modal-user" onClick={() => { onClose(); onNavigate(u.username); }}>
              <Avatar src={u.profile_pic} sx={{ width: 40, height: 40, background: "var(--raised)", fontSize: 16, fontFamily: "var(--font-display)" }}>
                {!u.profile_pic && u.username?.charAt(0).toUpperCase()}
              </Avatar>
              <span className="prof-modal-username">@{u.username}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfilePage() {
  useFonts();
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [modal, setModal] = useState(null); // 'followers' | 'following' | null

  // Get current logged-in user from token
  const token = getToken();
  let currentUser = null;
  if (token) {
    try {
      currentUser = JSON.parse(atob(token.split(".")[1]));
    } catch (_) {}
  }

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadProfile();
  }, [username]);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await apiFetch(`/profile/${username}`);
      if (!res) return;
      const data = await res.json();
      if (res.status === 404) { navigate("/home"); return; }
      setProfile(data);
      setFollowing(data.isFollowing);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow() {
    setFollowLoading(true);
    try {
      if (following) {
        await apiFetch(`/follow/${profile.id}`, { method: "DELETE" });
        setFollowing(false);
        setProfile(p => ({ ...p, followerCount: p.followerCount - 1 }));
      } else {
        await apiFetch(`/follow/${profile.id}`, { method: "POST" });
        setFollowing(true);
        setProfile(p => ({ ...p, followerCount: p.followerCount + 1 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  }

  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className="prof-page">
        <div className="prof-loading">
          <div className="prof-spinner" />
          <Typography sx={{ color: "var(--muted)", fontFamily: "var(--font-body)", fontSize: 14 }}>Loading profile…</Typography>
        </div>
      </div>
    </>
  );

  if (!profile) return null;

  const initial = profile.username?.charAt(0).toUpperCase();

  return (
    <>
      <style>{STYLES}</style>
      {modal && (
        <FollowersModal
          title={modal === "followers" ? "Followers" : "Following"}
          userId={profile.id}
          type={modal}
          onClose={() => setModal(null)}
          onNavigate={(u) => navigate(`/profile/${u}`)}
        />
      )}

      <div className="prof-page">
        {/* NAV */}
        <nav className="prof-nav">
          <div className="prof-logo" onClick={() => navigate("/")}>
            <div className="prof-logo-icon"><Movie sx={{ fontSize: 18 }} /></div>
            MOVIE RATER
          </div>
          <div className="prof-nav-actions">
            <Button className="prof-nav-btn" startIcon={<ArrowBack sx={{ fontSize: 15 }} />} onClick={() => navigate("/home")}>
              Home
            </Button>
            {isOwnProfile && (
              <Button className="prof-nav-btn" startIcon={<Settings sx={{ fontSize: 15 }} />} onClick={() => navigate("/settings")}>
                Settings
              </Button>
            )}
          </div>
        </nav>

        {/* COVER */}
        <div className="prof-cover">
          <div className="prof-cover-pattern" />
        </div>

        {/* HEADER */}
        <div className="prof-header">
          <div className="prof-avatar-wrap">
            <Avatar
              src={profile.profile_pic}
              className="prof-avatar"
              sx={{ width: 112, height: 112, border: "4px solid var(--ink)", fontSize: 40, fontFamily: "var(--font-display)", background: "var(--raised)" }}
            >
              {!profile.profile_pic && initial}
            </Avatar>
          </div>

          <div className="prof-header-info">
            <div>
              <div className="prof-username">@{profile.username}</div>
              {profile.bio && <div className="prof-bio">{profile.bio}</div>}
              <div className="prof-meta">
                <div className="prof-meta-item" onClick={() => setModal("followers")}>
                  <span className="prof-meta-num">{profile.followerCount}</span>
                  <span>followers</span>
                </div>
                <div className="prof-meta-item" onClick={() => setModal("following")}>
                  <span className="prof-meta-num">{profile.followingCount}</span>
                  <span>following</span>
                </div>
              </div>
              <div className="prof-privacy-badge">
                <Lock sx={{ fontSize: 11 }} />
                {profile.is_public ? "Public profile" : "Private profile"}
              </div>
            </div>

            {/* Action buttons */}
            {!isOwnProfile && (
              <Button
                className={following ? "prof-unfollow-btn" : "prof-follow-btn"}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? "…" : following ? "Unfollow" : "Follow"}
              </Button>
            )}
            {isOwnProfile && (
              <Button className="prof-edit-btn" startIcon={<Edit sx={{ fontSize: 15 }} />} onClick={() => navigate("/settings")}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <hr className="prof-divider" />

        {/* BODY */}
        <div className="prof-body">

          {/* LOCKED */}
          {profile.locked && !isOwnProfile ? (
            <div className="prof-locked fade-up">
              <div className="prof-locked-icon">
                <Lock sx={{ fontSize: 28, color: "var(--muted)" }} />
              </div>
              <Typography sx={{ fontFamily: "var(--font-display)", fontSize: 24, letterSpacing: 2, color: "#f0f0f5", mb: 1 }}>
                PRIVATE PROFILE
              </Typography>
              <Typography sx={{ fontSize: 14, color: "var(--muted)", mb: 3 }}>
                Follow @{profile.username} to see their movies and activity
              </Typography>
              <Button className="prof-follow-btn" onClick={handleFollow} disabled={followLoading}>
                {followLoading ? "…" : "Follow"}
              </Button>
            </div>
          ) : (
            <Stack spacing={4}>

              {/* STATS */}
              <div className="prof-stats fade-up">
                <div className="prof-stat">
                  <div className="prof-stat-num">{profile.stats?.totalMovies ?? 0}</div>
                  <div className="prof-stat-label">Movies</div>
                </div>
                <div className="prof-stat">
                  <div className="prof-stat-num">{profile.stats?.avgRating ?? 0}</div>
                  <div className="prof-stat-label">Avg Rating</div>
                </div>
                <div className="prof-stat">
                  <div className="prof-stat-num">{profile.followerCount}</div>
                  <div className="prof-stat-label">Followers</div>
                </div>
              </div>

              {/* TOP 3 */}
              {profile.top3?.length > 0 && (
                <div className="prof-section fade-up">
                  <div className="prof-section-header">
                    <Favorite className="prof-section-icon" sx={{ fontSize: 18 }} />
                    TOP RATED
                  </div>
                  <div className="prof-movies-row">
                    {profile.top3.map(m => (
                      <a key={m.id} className="prof-movie-card"
                        href={`https://www.themoviedb.org/movie/${m.id}`} target="_blank" rel="noreferrer">
                        {m.poster_path
                          ? <img className="prof-movie-poster" src={`https://image.tmdb.org/t/p/w342${m.poster_path}`} alt={m.title} />
                          : <div className="prof-movie-poster-fallback"><Movie sx={{ fontSize: 28, color: "var(--muted)", opacity: 0.4 }} /></div>
                        }
                        <div className="prof-movie-info">
                          <div className="prof-movie-title">{m.title}</div>
                          <div className="prof-movie-chips">
                            <span className="prof-chip prof-chip-mine">⭐ {m.my_rating}/100</span>
                            {m.tmdb_rating && <span className="prof-chip prof-chip-tmdb">TMDB {m.tmdb_rating}</span>}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* RECENTLY WATCHED */}
              {profile.recentlyWatched?.length > 0 && (
                <div className="prof-section fade-up">
                  <div className="prof-section-header">
                    <AccessTime className="prof-section-icon" sx={{ fontSize: 18 }} />
                    RECENTLY WATCHED
                  </div>
                  <div className="prof-movies-row">
                    {profile.recentlyWatched.map(m => (
                      <a key={m.id} className="prof-movie-card"
                        href={`https://www.themoviedb.org/movie/${m.id}`} target="_blank" rel="noreferrer">
                        {m.poster_path
                          ? <img className="prof-movie-poster" src={`https://image.tmdb.org/t/p/w342${m.poster_path}`} alt={m.title} />
                          : <div className="prof-movie-poster-fallback"><Movie sx={{ fontSize: 28, color: "var(--muted)", opacity: 0.4 }} /></div>
                        }
                        <div className="prof-movie-info">
                          <div className="prof-movie-title">{m.title}</div>
                          <div className="prof-movie-chips">
                            <span className="prof-chip prof-chip-mine">⭐ {m.my_rating}/100</span>
                            {m.watched_month && m.watched_year && (
                              <span style={{ fontSize: 11, color: "var(--muted)" }}>{m.watched_month}/{m.watched_year}</span>
                            )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTIVITY */}
              {profile.recentActivity?.length > 0 && (
                <div className="prof-section fade-up">
                  <div className="prof-section-header">
                    <TrendingUp className="prof-section-icon" sx={{ fontSize: 18 }} />
                    RECENT ACTIVITY
                  </div>
                  <div className="prof-activity-list">
                    {profile.recentActivity.map((a, i) => (
                      <div key={i} className="prof-activity-item">
                        {a.poster_path
                          ? <img className="prof-activity-poster" src={`https://image.tmdb.org/t/p/w92${a.poster_path}`} alt={a.title} />
                          : <div className="prof-activity-poster"><Movie sx={{ fontSize: 16, color: "var(--muted)" }} /></div>
                        }
                        <div className="prof-activity-info">
                          <div className="prof-activity-title">{a.title}</div>
                          <div className="prof-activity-meta">{timeAgo(a.created_at)}</div>
                        </div>
                        <span className={`prof-activity-type type-${a.type}`}>{a.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EMPTY STATE */}
              {!profile.top3?.length && !profile.recentActivity?.length && (
                <div className="prof-locked fade-up">
                  <div className="prof-locked-icon">
                    <Movie sx={{ fontSize: 28, color: "var(--muted)" }} />
                  </div>
                  <Typography sx={{ fontFamily: "var(--font-display)", fontSize: 24, letterSpacing: 2, color: "var(--muted)" }}>
                    NO MOVIES YET
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: "var(--muted)", mt: 1 }}>
                    @{profile.username} hasn't logged any movies yet
                  </Typography>
                </div>
              )}

            </Stack>
          )}
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
