import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box, Button, Divider, IconButton,
  InputAdornment, TextField, Typography,
} from "@mui/material";
import {
  Lock, Visibility, VisibilityOff, Email,
  Google, Facebook, GitHub, Movie,
} from "@mui/icons-material";
axios.defaults.withCredentials = true;

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
  .login-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--ink);
    position: relative;
    overflow: hidden;
  }

  /* subtle background glow */
  .login-page::before {
    content: '';
    position: fixed;
    top: -10%;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 500px;
    background: radial-gradient(ellipse, rgba(232,197,71,0.05) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── NAV ── */
  .login-nav {
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

  .login-logo {
    font-family: var(--font-display);
    font-size: 28px;
    letter-spacing: 2px;
    color: var(--accent);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity var(--transition);
    text-decoration: none;
  }
  .login-logo:hover { opacity: 0.8; }

  .login-logo-icon {
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

  .login-nav-link {
    font-size: 13px !important;
    color: var(--muted) !important;
  }

  .login-nav-link span { color: var(--accent); font-weight: 600; }

  /* ── BODY ── */
  .login-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    position: relative;
    z-index: 1;
  }

  /* ── CARD ── */
  .login-card {
    width: 100%;
    max-width: 420px;
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
  .login-eyebrow {
    font-family: var(--font-display);
    font-size: 12px;
    letter-spacing: 4px;
    color: var(--accent2);
    margin-bottom: 10px;
    text-align: center;
  }

  .login-title {
    font-family: var(--font-display) !important;
    font-size: 42px !important;
    letter-spacing: 2px !important;
    color: #f0f0f5 !important;
    text-align: center;
    line-height: 1 !important;
    margin-bottom: 6px !important;
  }

  .login-sub {
    font-size: 14px !important;
    color: var(--muted) !important;
    text-align: center;
    margin-bottom: 32px !important;
  }

  /* ── ERROR ── */
  .login-error {
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
  .login-field .MuiInputBase-input {
    color: #e0e0e8 !important;
    font-family: var(--font-body) !important;
    font-size: 14px !important;
  }

  .login-field .MuiInputLabel-root {
    color: var(--muted) !important;
    font-family: var(--font-body) !important;
    font-size: 14px !important;
  }

  .login-field .MuiInputLabel-root.Mui-focused {
    color: var(--accent2) !important;
  }

  .login-field .MuiOutlinedInput-root fieldset {
    border-color: var(--border) !important;
    border-radius: 12px !important;
    transition: border-color var(--transition) !important;
  }

  .login-field .MuiOutlinedInput-root:hover fieldset {
    border-color: rgba(255,255,255,0.18) !important;
  }

  .login-field .MuiOutlinedInput-root.Mui-focused fieldset {
    border-color: var(--accent2) !important;
    box-shadow: 0 0 0 3px rgba(93,232,197,0.10) !important;
  }

  /* ── SUBMIT ── */
  .login-submit {
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
  .login-submit:hover {
    background: #f0d050 !important;
    transform: scale(1.02);
  }
  .login-submit:disabled {
    opacity: 0.6 !important;
  }

  /* ── DIVIDER ── */
  .login-divider {
    margin: 28px 0 !important;
    font-family: var(--font-body) !important;
    font-size: 11px !important;
    letter-spacing: 2px !important;
    color: var(--muted) !important;
  }

  .login-divider::before,
  .login-divider::after {
    border-color: var(--border) !important;
  }

  /* ── OAUTH BUTTONS ── */
  .login-oauth-btn {
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

  .login-oauth-btn:last-child { margin-bottom: 0 !important; }

  .login-oauth-btn:hover {
    background: #2e2e3a !important;
    border-color: rgba(255,255,255,0.18) !important;
  }

  /* ── FOOTER LINK ── */
  .login-footer-text {
    text-align: center;
    font-size: 13px !important;
    color: var(--muted) !important;
    margin-top: 28px !important;
  }

  .login-footer-text a {
    color: var(--accent) !important;
    font-weight: 600 !important;
    text-decoration: none !important;
    transition: opacity var(--transition) !important;
  }
  .login-footer-text a:hover { opacity: 0.8; }
`;

function LoginPage() {
  useFonts();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  function handleChange(e) {
    setError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

 async function handleSubmit(e) {
  e.preventDefault();

  if (!formData.email || !formData.password) {
    setError("Please fill in all fields.");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/login`,
      formData,
      { withCredentials: true }
    );

    console.log(response.data);

    navigate("/home");
  } catch (err) {
    setError(
      err?.response?.data?.message ??
      "Invalid email or password. Please try again."
    );
  } finally {
    setLoading(false);
  }
}

  const fieldSx = { mb: 0 };

  return (
    <>
      <style>{STYLES}</style>

      <div className="login-page">

        {/* ── NAV ── */}
        <nav className="login-nav">
          <div className="login-logo" onClick={() => navigate("/")}>
            <div className="login-logo-icon">
              <Movie sx={{ fontSize: 20 }} />
            </div>
            MOVIE RATER
          </div>
          <Typography className="login-nav-link">
            No account? <Link to="/register"><span>Register free</span></Link>
          </Typography>
        </nav>

        {/* ── BODY ── */}
        <div className="login-body">
          <div className="login-card">

            <div className="login-eyebrow">WELCOME BACK</div>
            <Typography className="login-title">Sign in</Typography>
            <Typography className="login-sub">Pick up right where you left off.</Typography>

            {error && <div className="login-error">{error}</div>}

            <Box component="form" onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <TextField
                className="login-field"
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
                sx={fieldSx}
              />

              {/* Password */}
              <TextField
                className="login-field"
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                autoComplete="current-password"
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
                sx={fieldSx}
              />

              <Button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>

            </Box>

            {/* Divider */}
            <Divider className="login-divider">OR CONTINUE WITH</Divider>

            {/* OAuth */}
            <Button
              className="login-oauth-btn"
              variant="outlined"
              startIcon={<Google sx={{ fontSize: 18 }} />}
              href={`${import.meta.env.VITE_API_URL}/auth/google`}
            >
              Continue with Google
            </Button>

            <Button
              className="login-oauth-btn"
              variant="outlined"
              startIcon={<Facebook sx={{ fontSize: 18 }} />}
              href={`${import.meta.env.VITE_API_URL}/auth/facebook`}
            >
              Continue with Facebook
            </Button>

            <Button
              className="login-oauth-btn"
              variant="outlined"
              startIcon={<GitHub sx={{ fontSize: 18 }} />}
              href={`${import.meta.env.VITE_API_URL}/auth/github`}
            >
              Continue with GitHub
            </Button>

            <Typography className="login-footer-text">
              Don't have an account? <Link to="/register">Create one free</Link>
            </Typography>

          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
