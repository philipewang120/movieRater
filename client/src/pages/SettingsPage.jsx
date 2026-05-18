import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getToken, saveToken } from "../api";
import {
  Box, Button, TextField, Typography, Stack,
  Switch, FormControlLabel, Avatar, CircularProgress,
} from "@mui/material";
import {
  Movie, ArrowBack, CameraAlt, Save, Lock, LockOpen, Person,
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
  .set-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 68px;
    background: var(--surface); border-bottom: 1px solid var(--border);
    box-shadow: 0 1px 24px rgba(0,0,0,0.5);
  }
  @media (max-width: 600px) { .set-nav { padding: 0 20px; } }

  .set-logo {
    font-family: var(--font-display); font-size: 26px; letter-spacing: 2px;
    color: var(--accent); display: flex; align-items: center; gap: 8px;
    cursor: pointer; transition: opacity var(--transition);
  }
  .set-logo:hover { opacity: 0.8; }
  .set-logo-icon {
    width: 34px; height: 34px; background: var(--accent); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; color: var(--ink);
  }

  .set-back-btn {
    background: var(--raised) !important; color: var(--muted) !important;
    border: 1px solid var(--border) !important; border-radius: 10px !important;
    text-transform: none !important; font-family: var(--font-body) !important;
    font-size: 13px !important; padding: 6px 14px !important;
    transition: all var(--transition) !important;
  }
  .set-back-btn:hover {
    background: #2e2e3a !important; color: #e0e0e8 !important;
    border-color: rgba(255,255,255,0.18) !important;
  }

  /* PAGE */
  .set-page { min-height: 100vh; background: var(--ink); }

  /* BODY */
  .set-body {
    max-width: 640px; margin: 0 auto;
    padding: 48px 32px 80px;
  }
  @media (max-width: 600px) { .set-body { padding: 32px 20px 64px; } }

  .set-page-title {
    font-family: var(--font-display) !important;
    font-size: 42px !important; letter-spacing: 2px !important;
    color: #f0f0f5 !important; margin-bottom: 4px !important;
  }
  .set-page-sub {
    font-size: 14px !important; color: var(--muted) !important;
    margin-bottom: 40px !important;
  }

  /* SECTION CARD */
  .set-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 28px 28px;
    margin-bottom: 20px;
  }

  .set-card-title {
    font-family: var(--font-display); font-size: 16px; letter-spacing: 2px;
    color: var(--accent2); margin-bottom: 20px;
    display: flex; align-items: center; gap: 8px;
  }

  /* AVATAR UPLOAD */
  .set-avatar-wrap {
    display: flex; align-items: center; gap: 24px; margin-bottom: 8px;
  }

  .set-avatar-btn {
    position: relative; cursor: pointer; flex-shrink: 0;
  }

  .set-avatar-overlay {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity var(--transition);
  }
  .set-avatar-btn:hover .set-avatar-overlay { opacity: 1; }

  .set-avatar-hint {
    font-size: 12px; color: var(--muted); line-height: 1.5;
  }
  .set-avatar-hint strong { color: #e0e0e8; }

  /* TEXT FIELDS */
  .set-field .MuiInputBase-input {
    color: #e0e0e8 !important; font-family: var(--font-body) !important; font-size: 14px !important;
  }
  .set-field .MuiInputLabel-root { color: var(--muted) !important; font-family: var(--font-body) !important; font-size: 14px !important; }
  .set-field .MuiInputLabel-root.Mui-focused { color: var(--accent2) !important; }
  .set-field .MuiOutlinedInput-root fieldset { border-color: var(--border) !important; border-radius: 12px !important; }
  .set-field .MuiOutlinedInput-root:hover fieldset { border-color: rgba(255,255,255,0.18) !important; }
  .set-field .MuiOutlinedInput-root.Mui-focused fieldset { border-color: var(--accent2) !important; box-shadow: 0 0 0 3px rgba(93,232,197,0.10) !important; }
  .set-field .MuiFormHelperText-root { color: var(--muted) !important; font-family: var(--font-body) !important; font-size: 11px !important; }

  /* USERNAME RULES */
  .set-username-rules {
    margin-top: 8px; padding: 12px 14px;
    background: rgba(93,232,197,0.06); border: 1px solid rgba(93,232,197,0.12);
    border-radius: 10px;
  }
  .set-rule {
    font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 6px;
    margin-bottom: 4px;
  }
  .set-rule:last-child { margin-bottom: 0; }
  .set-rule-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    background: var(--muted);
  }
  .set-rule.valid .set-rule-dot { background: var(--accent2); }
  .set-rule.valid { color: var(--accent2); }

  /* CHAR COUNT */
  .set-char-count {
    text-align: right; font-size: 11px; color: var(--muted); margin-top: 4px;
  }
  .set-char-count.warn { color: #f4a261; }

  /* PRIVACY TOGGLE */
  .set-privacy-row {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px;
  }
  .set-privacy-info { flex: 1; }
  .set-privacy-label { font-size: 15px; font-weight: 600; color: #e0e0e8; margin-bottom: 4px; }
  .set-privacy-desc { font-size: 13px; color: var(--muted); }

  .MuiSwitch-root .MuiSwitch-track { background: var(--raised) !important; }
  .MuiSwitch-root .Mui-checked + .MuiSwitch-track { background: var(--accent2) !important; opacity: 0.5 !important; }
  .MuiSwitch-root .Mui-checked .MuiSwitch-thumb { background: var(--accent2) !important; }

  /* BUTTONS */
  .set-save-btn {
    background: var(--accent) !important; color: var(--ink) !important;
    border-radius: 12px !important; height: 48px !important;
    font-family: var(--font-body) !important; font-weight: 700 !important;
    font-size: 15px !important; text-transform: none !important;
    width: 100%; transition: all var(--transition) !important;
    margin-top: 8px !important;
  }
  .set-save-btn:hover { background: #f0d050 !important; transform: scale(1.02); }
  .set-save-btn:disabled { opacity: 0.6 !important; }

  /* FEEDBACK */
  .set-success {
    background: rgba(93,232,197,0.1); border: 1px solid rgba(93,232,197,0.25);
    border-radius: 10px; padding: 12px 16px; font-size: 13px; color: var(--accent2);
    text-align: center; margin-bottom: 20px;
  }
  .set-error {
    background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.25);
    border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #ff6b6b;
    text-align: center; margin-bottom: 20px;
  }

  /* DANGER ZONE */
  .set-danger-card {
    background: rgba(255,107,107,0.05); border: 1px solid rgba(255,107,107,0.15);
    border-radius: var(--radius-lg); padding: 28px;
  }
  .set-danger-title {
    font-family: var(--font-display); font-size: 16px; letter-spacing: 2px;
    color: #ff6b6b; margin-bottom: 8px;
  }
  .set-danger-desc { font-size: 13px; color: var(--muted); margin-bottom: 16px; }
  .set-danger-btn {
    background: transparent !important; color: #ff6b6b !important;
    border: 1px solid rgba(255,107,107,0.3) !important; border-radius: 10px !important;
    text-transform: none !important; font-family: var(--font-body) !important;
    font-size: 13px !important; padding: 8px 20px !important;
    transition: all var(--transition) !important;
  }
  .set-danger-btn:hover {
    background: rgba(255,107,107,0.1) !important;
    border-color: rgba(255,107,107,0.5) !important;
  }
`;

function usernameRules(val) {
  return [
    { label: "At least 3 characters",              valid: val.length >= 3 },
    { label: "No more than 30 characters",          valid: val.length <= 30 && val.length > 0 },
    { label: "Letters, numbers, underscores only",  valid: /^[a-zA-Z0-9_]*$/.test(val) && val.length > 0 },
  ];
}

function SettingsPage() {
  useFonts();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Read current user from token
  const token = getToken();
  let currentUser = null;
  if (token) {
    try { currentUser = JSON.parse(atob(token.split(".")[1])); } catch (_) {}
  }

  const [username,    setUsername]    = useState(currentUser?.username ?? "");
  const [bio,         setBio]         = useState("");
  const [isPublic,    setIsPublic]    = useState(false);
  const [profilePic,  setProfilePic]  = useState(currentUser?.profile_pic ?? "");
  const [avatarFile,  setAvatarFile]  = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.profile_pic ?? "");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [uploadingPic,setUploadingPic]= useState(false);
  const [success,     setSuccess]     = useState("");
  const [error,       setError]       = useState("");

  const rules = usernameRules(username);
  const allRulesPass = rules.every(r => r.valid);
  const bioLength = bio.length;

  // Load current profile data
  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (!currentUser?.username) { setLoading(false); return; }

    apiFetch(`/profile/${currentUser.username}`)
      .then(r => r?.json())
      .then(data => {
        if (data) {
          setUsername(data.username ?? "");
          setBio(data.bio ?? "");
          setIsPublic(data.is_public ?? false);
          setProfilePic(data.profile_pic ?? "");
          setAvatarPreview(data.profile_pic ?? "");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  }

  async function uploadAvatar() {
    if (!avatarFile) return null;
    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData, // No Content-Type header — browser sets it with boundary
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Save new token with updated profile pic
      saveToken(data.token);
      return data.profile_pic;
    } catch (err) {
      setError(err.message ?? "Failed to upload photo.");
      return null;
    } finally {
      setUploadingPic(false);
    }
  }

  async function handleSave() {
    if (!allRulesPass) {
      setError("Please fix the username issues before saving.");
      return;
    }
    if (bioLength > 150) {
      setError("Bio must be 150 characters or less.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Upload avatar first if changed
      let newProfilePic = profilePic;
      if (avatarFile) {
        const uploaded = await uploadAvatar();
        if (!uploaded) { setSaving(false); return; }
        newProfilePic = uploaded;
      }

      // Update profile info
      const res = await apiFetch("/profile/edit", {
        method: "PUT",
        body: JSON.stringify({ username, bio, profile_pic: newProfilePic }),
      });

      const data = await res?.json();
      if (!res?.ok) throw new Error(data?.message ?? "Failed to save");

      // Save fresh token
      if (data.token) saveToken(data.token);

      setSuccess("Profile updated successfully!");
      setAvatarFile(null);

      // Navigate to their profile after short delay
      setTimeout(() => navigate(`/profile/${username}`), 1200);

    } catch (err) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePrivacyToggle() {
    try {
      const res = await apiFetch("/profile/privacy", { method: "PUT" });
      const data = await res?.json();
      if (data) setIsPublic(data.is_public);
    } catch (err) {
      setError("Failed to update privacy setting.");
    }
  }

  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className="set-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: "var(--accent)" }} />
      </div>
    </>
  );

  const initial = username?.charAt(0).toUpperCase();

  return (
    <>
      <style>{STYLES}</style>

      <div className="set-page">
        {/* NAV */}
        <nav className="set-nav">
          <div className="set-logo" onClick={() => navigate("/")}>
            <div className="set-logo-icon"><Movie sx={{ fontSize: 18 }} /></div>
            MOVIE RATER
          </div>
          <Button
            className="set-back-btn"
            startIcon={<ArrowBack sx={{ fontSize: 15 }} />}
            onClick={() => navigate(`/profile/${currentUser?.username}`)}
          >
            Back to profile
          </Button>
        </nav>

        <div className="set-body">
          <Typography className="set-page-title">Settings</Typography>
          <Typography className="set-page-sub">Manage your profile and account preferences</Typography>

          {success && <div className="set-success">✓ {success}</div>}
          {error   && <div className="set-error">✕ {error}</div>}

          {/* ── AVATAR ── */}
          <div className="set-card fade-up">
            <div className="set-card-title">
              <CameraAlt sx={{ fontSize: 16 }} /> PROFILE PHOTO
            </div>
            <div className="set-avatar-wrap">
              <div className="set-avatar-btn" onClick={() => fileInputRef.current?.click()}>
                <Avatar
                  src={avatarPreview}
                  sx={{ width: 80, height: 80, fontSize: 32, fontFamily: "var(--font-display)", background: "var(--raised)" }}
                >
                  {!avatarPreview && initial}
                </Avatar>
                <div className="set-avatar-overlay">
                  {uploadingPic
                    ? <CircularProgress size={20} sx={{ color: "#fff" }} />
                    : <CameraAlt sx={{ fontSize: 20, color: "#fff" }} />
                  }
                </div>
              </div>
              <div className="set-avatar-hint">
                <strong>Click to upload a new photo</strong><br />
                JPG, PNG or WebP · Max 5MB<br />
                Will be cropped to a square
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
            {avatarFile && (
              <Typography sx={{ fontSize: 12, color: "var(--accent2)", mt: 1 }}>
                ✓ New photo selected — save to apply
              </Typography>
            )}
          </div>

          {/* ── PROFILE INFO ── */}
          <div className="set-card fade-up" style={{ animationDelay: "0.05s" }}>
            <div className="set-card-title">
              <Person sx={{ fontSize: 16 }} /> PROFILE INFO
            </div>
            <Stack spacing={2.5}>

              {/* Username */}
              <Box>
                <TextField
                  className="set-field"
                  label="Username"
                  fullWidth
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(""); }}
                  inputProps={{ maxLength: 30 }}
                />
                <div className="set-username-rules">
                  {rules.map((r, i) => (
                    <div key={i} className={`set-rule${r.valid ? " valid" : ""}`}>
                      <div className="set-rule-dot" />
                      {r.label}
                    </div>
                  ))}
                </div>
              </Box>

              {/* Bio */}
              <Box>
                <TextField
                  className="set-field"
                  label="Bio"
                  fullWidth
                  multiline
                  rows={3}
                  value={bio}
                  onChange={e => { setBio(e.target.value); setError(""); }}
                  inputProps={{ maxLength: 150 }}
                  placeholder="Tell people a little about yourself…"
                />
                <div className={`set-char-count${bioLength > 130 ? " warn" : ""}`}>
                  {bioLength}/150
                </div>
              </Box>

            </Stack>
          </div>

          {/* ── PRIVACY ── */}
          <div className="set-card fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="set-card-title">
              <Lock sx={{ fontSize: 16 }} /> PRIVACY
            </div>
            <div className="set-privacy-row">
              <div className="set-privacy-info">
                <div className="set-privacy-label">
                  {isPublic ? "Public Profile" : "Private Profile"}
                </div>
                <div className="set-privacy-desc">
                  {isPublic
                    ? "Anyone can see your movies, stats and activity"
                    : "Only your followers can see your content"}
                </div>
              </div>
              <Switch
                checked={isPublic}
                onChange={handlePrivacyToggle}
                sx={{
                  "& .MuiSwitch-thumb": { background: isPublic ? "var(--accent2)" : "var(--muted)" },
                  "& .MuiSwitch-track": { background: "var(--raised) !important" },
                  "& .Mui-checked + .MuiSwitch-track": { background: "var(--accent2) !important", opacity: "0.4 !important" },
                }}
              />
            </div>
          </div>

          {/* ── SAVE ── */}
          <Button
            className="set-save-btn fade-up"
            onClick={handleSave}
            disabled={saving || !allRulesPass}
            startIcon={saving ? <CircularProgress size={16} sx={{ color: "var(--ink)" }} /> : <Save sx={{ fontSize: 18 }} />}
            style={{ animationDelay: "0.15s" }}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>

        </div>
      </div>
    </>
  );
}

export default SettingsPage;
