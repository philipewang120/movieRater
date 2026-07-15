
import express from "express";
import passport from "../config/passport.js";

import { ensureUsername, getUserRole } from "../helpers/authHelpers.js";
import {  authLimiter,} from "../middleware/rateLimiters.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import db from "../db.js";


const router = express.Router();
const saltRounds = 10;
// check auth status and user info
router.get("/auth/user", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});
//logout route (client just deletes token, no server action needed)
router.post("/api/logout", (req, res) => {
  res.json({ success: true }); // client just deletes the token
});

router.get("/auth/google", authLimiter,
  passport.authenticate("google", { scope: ["profile", "email"] })
);
//google callback route
router.get(
  "/auth/google/mymovies",
  passport.authenticate("google", {
    failureRedirect:
      "https://wangmovierater.netlify.app/login",
    session: false,
  }),
  async (req, res) => {
    try {
      const username = await ensureUsername(
        req.user.id,
        req.user.email
      );

      const role = await getUserRole(req.user.id);

      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          profile_pic: req.user.profile_pic,
          username,
          role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.redirect(
        `https://wangmovierater.netlify.app/home?token=${token}`
      );
    } catch (err) {
      console.error(err);

      res.redirect(
        "https://wangmovierater.netlify.app/login"
      );
    }
  }
);


// ── FACEBOOK 
router.get("/auth/facebook",
  authLimiter,
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get("/auth/facebook/callback",
  authLimiter,
  passport.authenticate("facebook", {
    failureRedirect: "https://wangmovierater.netlify.app/login",
    session: false
  }),
  async (req, res) => {
    try {
      const username = await ensureUsername(
        req.user.id,
        req.user.email
      );

      const role = await getUserRole(req.user.id);

      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          profile_pic: req.user.profile_pic,
          username,
          role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.redirect(
        `https://wangmovierater.netlify.app/home?token=${token}`
      );
    } catch (err) {
      console.error(err);

      res.redirect(
        "https://wangmovierater.netlify.app/login"
      );
    }
  }

);
// ── GITHUB 
router.get("/auth/github", authLimiter,
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get("/auth/github/mymovies",
  passport.authenticate("github", {
    failureRedirect: "https://wangmovierater.netlify.app/login",
    session: false
  }),
  async (req, res) => {
    try {
      const username = await ensureUsername(
        req.user.id,
        req.user.email
      );

      const role = await getUserRole(req.user.id);

      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          profile_pic: req.user.profile_pic,
          username,
          role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.redirect(
        `https://wangmovierater.netlify.app/home?token=${token}`
      );
    } catch (err) {
      console.error(err);

      res.redirect(
        "https://wangmovierater.netlify.app/login"
      );
    }
  }
);

router.post("/login", authLimiter, (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {  
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const username = await ensureUsername(user.id, user.email);
    const role = await getUserRole(user.id); 

    const token = jwt.sign(
      { id: user.id, email: user.email, profile_pic: user.profile_pic, username, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({ message: "Login successful", token });

  })(req, res, next);
});

router.post("/register", authLimiter, async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const providedUsername = req.body.username?.trim();

  try {
    const checkResult = await db.query(
      "SELECT * FROM users WHERE email = $1", [email]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check username is not taken
    if (providedUsername) {
      const usernameTaken = await db.query(
        "SELECT id FROM users WHERE username = $1", [providedUsername]
      );
      if (usernameTaken.rows.length > 0) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        return res.status(500).json({ message: "Error hashing password" });
      }

      const result = await db.query(
        "INSERT INTO users (email, password, profile_pic) VALUES ($1, $2, $3) RETURNING *",
        [email, hash, null]
      );

      const user = result.rows[0];

      // Use provided username, or auto-generate from email as fallback
      const username = providedUsername || await ensureUsername(user.id, user.email);
      const role = await getUserRole(user.id);
      
      // Save it if it was provided (ensureUsername already saves if auto-generated)
      if (providedUsername) {
        await db.query(
          "UPDATE users SET username = $1 WHERE id = $2",
          [providedUsername, user.id]
        );
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, profile_pic: user.profile_pic, username, role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(201).json({ message: "User registered successfully", token });
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;