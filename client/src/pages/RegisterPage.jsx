import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box, Button, Divider, IconButton,
  InputAdornment, TextField, Typography,
} from "@mui/material";
import {
  Lock, Visibility, VisibilityOff,
  Email, Person, Google, Facebook, GitHub, Movie,
} from "@mui/icons-material";

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

  body {
    background: var(--ink);
    font-family: var(--font-body);
    color: #e0e0e8;
  }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--raised); border-radius: 4px; }

  /* ── PAGE ── */
  .reg-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--ink);
    position: relative;
    overflow: hidden;
  }

  /* teal glow — different from login's gold to signal "new here" */
  .reg-page::before {
    content: '';
    position: fixed;
    top: -10%;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 500px;
    background: radial-gradient(ellipse, rgba(93,232,197,0.05) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── NAV ── */
  .reg-nav {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 48px;
    height: 68px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 1px 24px rgba(0,0,0,0.5);
    flex-shrink: 0;
  }

  .reg-logo {
    font-family: var(--font-display);
    font-size: 28px;
    letter-spacing: 2px;
    color: var(--accent);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity var(--transition);
  }
  .reg-logo:hover { opacity: 0.8; }

  .reg-logo-icon {
    width: 36px;
    height: 36px;
    background: var(--accent);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink);
    flex-shrink: 0;
  }

  .reg-nav-link {
    font-size: 13px !important;
    color: var(--muted) !important;
  }
  .reg-nav-link a {
    color: var(--accent) !important;
    font-weight: 600 !important;
    text-decoration: none !important;
    transition: opacity var(--transition) !important;
  }
  .reg-nav-link a:hover { opacity: 0.8; }

  /* ── BODY ── */
  .reg-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    position: relative;
    z-index: 1;
  }

  /* ── CARD ── */
  .reg-card {
    width: 100%;
    max-width: 440px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 40px 36px;
    animation: fadeUp 0.45s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── HEADINGS ── */
  .reg-eyebrow {
    font-family: var(--font-display);
    font-size: 12px;
    letter-spacing: 4px;
    color: var(--accent2);
    margin-bottom: 10px;
    text-align: center;
  }

  .reg-title {
    font-family: var(--font-display) !important;
    font-size: 42px !important;
    letter-spacing: 2px !important;
    color: #f0f0f5 !important;
    text-align: center;
    line-height: 1 !important;
    margin-bottom: 6px !important;
  }

  .reg-sub {
    font-size: 14px !important;
    color: var(--muted) !important;
    text-align: center;
    margin-bottom: 32px !important;
  }

  /* ── ERROR / SUCCESS ── */
  .reg-error {
    background: rgba(255, 80, 80, 0.1);
    border: 1px solid rgba(255, 80, 80, 0.25);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: #ff6b6b;
    margin-bottom: 16px;
    text-align: center;
  }

  /* ── TEXT FIELD OVERRIDES ── */
  .reg-field .MuiInputBase-input {
    color: #e0e0e8 !important;
    font-family: var(--font-body) !important;
    font-size: 14px !important;
  }

  .reg-field .MuiInputLabel-root {
    color: var(--muted) !important;
    font-family: var(--font-body) !important;
    font-size: 14px !important;
  }

  .reg-field .MuiInputLabel-root.Mui-focused {
    color: var(--accent2) !important;
  }

  .reg-field .MuiOutlinedInput-root fieldset {
    border-color: var(--border) !important;
    border-radius: 12px !important;
    transition: border-color var(--transition) !important;
  }

  .reg-field .MuiOutlinedInput-root:hover fieldset {
    border-color: rgba(255,255,255,0.18) !important;
  }

  .reg-field .MuiOutlinedInput-root.Mui-focused fieldset {
    border-color: var(--accent2) !important;
    box-shadow: 0 0 0 3px rgba(93,232,197,0.10) !important;
  }

  /* ── SUBMIT ── */
  .reg-submit {
    background: var(--accent) !important;
    color: var(--ink) !important;
    border-radius: 12px !important;
    height: 48px !important;
    font-family: var(--font-body) !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    text-transform: none !important;
    letter-spacing: 0.3px !important;
    width: 100%;
    margin-top: 24px !important;
    transition: background var(--transition), transform var(--transition) !important;
  }
  .reg-submit:hover {
    background: #f0d050 !important;
    transform: scale(1.02);
  }
  .reg-submit:disabled { opacity: 0.6 !important; }

  /* ── DIVIDER ── */
  .reg-divider {
    margin: 28px 0 !important;
    font-family: var(--font-body) !important;
    font-size: 11px !important;
    letter-spacing: 2px !important;
    color: var(--muted) !important;
  }
  .reg-divider::before,
  .reg-divider::after { border-color: var(--border) !important; }

  /* ── OAUTH BUTTONS ── */
  .reg-oauth-btn {
    width: 100%;
    height: 44px !important;
    border-radius: 12px !important;
    text-transform: none !important;
    font-family: var(--font-body) !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #e0e0e8 !important;
    border-color: var(--border) !important;
    background: var(--raised) !important;
    justify-content: flex-start !important;
    padding-left: 20px !important;
    gap: 12px !important;
    transition: background var(--transition), border-color var(--transition) !important;
    margin-bottom: 10px !important;
    display: flex !important;
  }
  .reg-oauth-btn:last-child { margin-bottom: 0 !important; }
  .reg-oauth-btn:hover {
    background: #2e2e3a !important;
    border-color: rgba(255,255,255,0.18) !important;
  }

  /* ── FOOTER LINK ── */
  .reg-footer-text {
    text-align: center;
    font-size: 13px !important;
    color: var(--muted) !important;
    margin-top: 28px !important;
  }
  .reg-footer-text a {
    color: var(--accent) !important;
    font-weight: 600 !important;
    text-decoration: none !important;
    transition: opacity var(--transition) !important;
  }
  .reg-footer-text a:hover { opacity: 0.8; }

  /* ── PASSWORD STRENGTH ── */
  .pw-strength-bar {
    height: 3px;
    border-radius: 4px;
    margin-top: 6px;
    transition: width 0.3s ease, background 0.3s ease;
  }

  .pw-strength-label {
    font-size: 11px;
    margin-top: 4px;
    text-align: right;
  }
`;

/* password strength helper */
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "transparent", width: "0%" };
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  const map = [
    { label: "Too short",  color: "#ff6b6b", width: "15%" },
    { label: "Weak",       color: "#ff9f43", width: "35%" },
    { label: "Fair",       color: "#e8c547", width: "60%" },
    { label: "Good",       color: "#5de8c5", width: "80%" },
    { label: "Strong",     color: "#2ecc71", width: "100%" },
  ];
  return { score, ...map[score] };
}

function RegisterPage() {
  useFonts();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });

  const strength = getStrength(formData.password);

  function handleChange(e) {
    setError("");
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/register`,
        formData,
        { withCredentials: true }
      );
      navigate("/home");
    } catch (err) {
      setError(
        err?.response?.data?.message ?? "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{STYLES}</style>

      <div className="reg-page">

        {/* ── NAV ── */}
        <nav className="reg-nav">
          <div className="reg-logo" onClick={() => navigate("/")}>
            <div className="reg-logo-icon">
              <Movie sx={{ fontSize: 20 }} />
            </div>
            MOVIE RATER
          </div>
          <Typography className="reg-nav-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </Typography>
        </nav>

        {/* ── BODY ── */}
        <div className="reg-body">
          <div className="reg-card">

            <div className="reg-eyebrow">JOIN MOVIE RATER</div>
            <Typography className="reg-title">Create account</Typography>
            <Typography className="reg-sub">
              Build your personal movie archive today.
            </Typography>

            {error && <div className="reg-error">{error}</div>}

            <Box component="form" onSubmit={handleSubmit} noValidate>

              {/* Username */}
              <TextField
                className="reg-field"
                fullWidth
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                autoComplete="username"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: "var(--muted)", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Email */}
              <TextField
                className="reg-field"
                fullWidth
                name="email"
                label="Email address"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: "var(--muted)", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password */}
              <TextField
                className="reg-field"
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "var(--muted)", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: "var(--muted)" }}
                      >
                        {showPassword
                          ? <VisibilityOff sx={{ fontSize: 18 }} />
                          : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password strength indicator */}
              {formData.password.length > 0 && (
                <Box sx={{ mt: 0.5, mb: 1 }}>
                  <div
                    className="pw-strength-bar"
                    style={{ background: strength.color, width: strength.width }}
                  />
                  <div
                    className="pw-strength-label"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </div>
                </Box>
              )}

              <Button
                type="submit"
                className="reg-submit"
                disabled={loading}
              >
                {loading ? "Creating account…" : "Create account"}
              </Button>

            </Box>

            {/* OAuth divider */}
            <Divider className="reg-divider">OR CONTINUE WITH</Divider>

            {/* OAuth buttons */}
            <Button
              className="reg-oauth-btn"
              variant="outlined"
              startIcon={<Google sx={{ fontSize: 18 }} />}
              href={`${import.meta.env.VITE_API_URL}/auth/google/mymovies`}
            >
              Continue with Google
            </Button>

            <Button
              className="reg-oauth-btn"
              variant="outlined"
              startIcon={<Facebook sx={{ fontSize: 18 }} />}
              href={`${import.meta.env.VITE_API_URL}/auth/facebook/callback`}
            >
              Continue with Facebook
            </Button>

            <Button
              className="reg-oauth-btn"
              variant="outlined"
              startIcon={<GitHub sx={{ fontSize: 18 }} />}
              href={`${import.meta.env.VITE_API_URL}/auth/github/mymovies`}
            >
              Continue with GitHub
            </Button>

            <Typography className="reg-footer-text">
              Already have an account? <Link to="/login">Sign in</Link>
            </Typography>

          </div>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;
