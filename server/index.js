import express from "express";
import dotenv from "dotenv";
import pg from "pg";
import bodyParser from "body-parser";
import axios from "axios";
import bcrypt from "bcryptjs";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import FacebookStrategy from "passport-facebook";
import { Strategy as LocalStrategy } from "passport-local";
import GitHubStrategy from "passport-github2";
import cors from "cors";
import jwt from "jsonwebtoken";


dotenv.config();

const app = express();

const port = process.env.PORT || 3000;
const saltRounds = 10;

const allowedOrigins = [
  "https://movie-rater-git-main-philipe-wang-s-projects.vercel.app",
];

app.set("trust proxy", 1);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));



const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});


// Middleware to verify JWT token for protected routes
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
//auto-generate username if user doesnt have any from email input.
function generateUsername(email) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_");
}
//ensure user has a username, if not generate one from email and handle duplicates by appending a number
async function ensureUsername(userId, email) {
  const existing = await db.query("SELECT username FROM users WHERE id = $1", [userId]);
  if (!existing.rows[0].username) {
    const base = generateUsername(email);
    let username = base;
    let counter = 1;
    // Handle duplicates by appending a number
    while (true) {
      const taken = await db.query("SELECT id FROM users WHERE username = $1", [username]);
      if (taken.rows.length === 0) break;
      username = `${base}${counter++}`;
    }
    await db.query("UPDATE users SET username = $1 WHERE id = $2", [username, userId]);
    return username;
  }
  return existing.rows[0].username;
}

app.use(passport.initialize());
//get all movies from db for specific user
app.get("/movies", verifyToken, async (req, res) => {

  try {

    const { sort } = req.query;

    let orderBy = "id DESC";
//sorting from backend based on query param, default is "id DESC" (newest first)
    switch (sort) {
      case "watched_asc":
        orderBy = "watched_year ASC, watched_month ASC";
        break;
      case "watched_desc":
        orderBy = "watched_year DESC, watched_month DESC";
        break;
      case "release_asc":
        orderBy = "release_date ASC";
        break;
      case "release_desc":
        orderBy = "release_date DESC";
        break;
      case "tmdb_desc":
        orderBy = "tmdb_rating DESC";
        break;
      case "tmdb_asc":
        orderBy = "tmdb_rating ASC";
        break;
      case "mine_desc":
        orderBy = "my_rating DESC";
        break;
      case "mine_asc":
        orderBy = "my_rating ASC";
        break;
    }

    const result = await db.query(
      `SELECT * FROM movies WHERE user_id = $1 ORDER BY ${orderBy}`,
      [req.user.id]
    );

    res.json({
      movies: result.rows,
      profile_pic: req.user.profile_pic,
      email: req.user.email
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load movies" });
  }
});
//search movie by title, case-insensitive
app.get("/movie/:title", async (req, res) => {
  const title = req.params.title;

  try {
    const response = await axios.get(
      "https://api.themoviedb.org/3/search/movie",
      {
        params: {
          query: title,
          include_adult: false,
          language: "en-US",
          page: 1,
        },
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${process.env.TMDB_BEARER}`,
        },
        
      }
    );

    const movie = response.data.results[0];

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    // return movie to frontend (NO DB INSERT HERE)
    res.json(movie);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});
//search top 5 movies of current year.
app.get("/top-movies", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const response = await axios.get(
      "https://api.themoviedb.org/3/discover/movie",
      {
        params: {
          language: "en-US",
          sort_by: "vote_average.desc",

          // only movies from this year
          primary_release_year: currentYear,

          // avoid movies with 2 ratings
          "vote_count.gte": 500,

          include_adult: false,
          page: 1
        },

        headers: {
          accept: "application/json",
          Authorization: `Bearer ${process.env.TMDB_BEARER}`
        }
      }
    );

    // take top 5
    const top5 = response.data.results.slice(0, 5);

    res.json(top5);

  } catch (error) {

    console.error(
      error.response?.data || error.message
    );

    res.status(500).json({
      message: "Failed to fetch movies"
    });
  }
});

app.post("/add", verifyToken, async (req, res) => {
  try {
    const {
      movie_id,
      title,
      watched_month,
      watched_year,
      remarks,
      my_rating,
      poster_path,
      tmdb_rating,
      release_date,
    } = req.body;

    if (!movie_id || !title) {
      return res.status(400).json({
        message: "Missing required movie data",
      });
    }

    const safeTmdbRating =
      tmdb_rating !== undefined && tmdb_rating !== null
        ? tmdb_rating * 10
        : null;

    await db.query(
      `INSERT INTO movies
      (movie_id, title, release_date, watched_month, watched_year, poster_path, remarks, tmdb_rating, my_rating, user_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        movie_id,
        title,
        release_date || null,
        watched_month || null,
        watched_year || null,
        poster_path || null,
        remarks || "",
        safeTmdbRating,
        my_rating || null,
        req.user.id,
      ]
    );
    await db.query(
  "INSERT INTO activities (user_id, type, movie_id) VALUES ($1, $2, $3)",
  [req.user.id, "added", result.rows[0].id] // make sure your INSERT returns the id
);

    res.json({ success: true });

  } catch (err) {
    console.error("ADD MOVIE ERROR:", err);
    res.status(500).json({ message: "Failed to add movie" });
  }
});

app.post("/edit", verifyToken, async (req, res) => {
  const {
    movieId,
    my_rating,
    watched_month,
    watched_year,
    remarks
  } = req.body;

  await db.query(
    `UPDATE movies
     SET my_rating = $1,
         watched_month = $2,
         watched_year = $3,
         remarks = $4
     WHERE id = $5 AND user_id = $6`,
    [
      my_rating,
      watched_month,
      watched_year,
      remarks,
      movieId,
      req.user.id
    ]
  );
  await db.query(
  "INSERT INTO activities (user_id, type, movie_id) VALUES ($1, $2, $3)",
  [req.user.id, "edited", movieId]
);

  res.json({ success: true });
});

app.post("/delete", verifyToken, async (req, res) => {
  const { movieId } = req.body;
  try {
    // Log activity before deleting 
    await db.query(
      "INSERT INTO activities (user_id, type, movie_id) VALUES ($1, $2, $3)",
      [req.user.id, "deleted", movieId]
    );

    await db.query(
      "DELETE FROM movies WHERE id = $1 AND user_id = $2",
      [movieId, req.user.id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete movie" });
  }
});

// ── AUTH USER (check token) 
app.get("/auth/user", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

// ── LOGOUT (handled client-side by deleting token, but we can also destroy session here if needed)
app.post("/api/logout", (req, res) => {
  res.json({ success: true }); // client just deletes the token
});


// ── GOOGLE 
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/mymovies",
  passport.authenticate("google", {
    failureRedirect: "https://movie-rater-git-main-philipe-wang-s-projects.vercel.app/login",
    session: false
  }),
  (req, res) => {
  ensureUsername(req.user.id, req.user.email).then((username) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, profile_pic: req.user.profile_pic, username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.redirect(`https://movie-rater-git-main-philipe-wang-s-projects.vercel.app/home?token=${token}`);
  });
}
);


// ── FACEBOOK 
app.get("/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

app.get("/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "https://movie-rater-git-main-philipe-wang-s-projects.vercel.app/login",
    session: false
  }),
  (req, res) => {
  ensureUsername(req.user.id, req.user.email).then((username) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, profile_pic: req.user.profile_pic, username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.redirect(`https://movie-rater-git-main-philipe-wang-s-projects.vercel.app/home?token=${token}`);
  });
}
);
// ── GITHUB 
app.get("/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

app.get("/auth/github/mymovies",
  passport.authenticate("github", {
    failureRedirect: "https://movie-rater-git-main-philipe-wang-s-projects.vercel.app/login",
    session: false
  }),
  (req, res) => {
  ensureUsername(req.user.id, req.user.email).then((username) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, profile_pic: req.user.profile_pic, username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.redirect(`https://movie-rater-git-main-philipe-wang-s-projects.vercel.app/home?token=${token}`);
  });
}
);

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({
        message: "Server error",
      });
    }

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
  const username = await ensureUsername(user.id, user.email);
    // create token
   const token = jwt.sign(
    { id: user.id, email: user.email, profile_pic: user.profile_pic, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  })(req, res, next);
});

app.post("/register", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const username = await ensureUsername(user.id, user.email);

  try {
    const checkResult = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);

        return res.status(500).json({
          message: "Error hashing password",
        });
      }

      const result = await db.query(
        "INSERT INTO users (email, password, profile_pic, username) VALUES ($1, $2, $3, $4) RETURNING *",
        [email, hash, null, username]
      );

      const user = result.rows[0];

     req.login(user, (err) => {
  if (err) return res.status(500).json({ message: "Login failed" });

  const token = jwt.sign(
    { id: user.id, email: user.email, profile_pic: user.profile_pic, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  
  return res.status(201).json({ message: "User registered successfully", token });
});
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Server error",
    });
  }
});


passport.use(
  "local",
  new LocalStrategy(
    { usernameField: "email" }, // 👈 THIS FIXES EVERYTHING
    async function verify(email, password, cb) {
      try {
        const result = await db.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );

        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;

          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return cb(err);
            }

            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          });
        } else {
          return cb(null, false);
        }
      } catch (err) {
        console.log(err);
        return cb(err);
      }
    }
  )
);

passport.use(
  "google", new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://movierater-dac6.onrender.com/auth/google/mymovies",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.emails[0].value,
        ]);
        if (result.rows.length === 0) {
          const profile_pic = profile.photos[0]?.value || null;
          const newUser = await db.query(
            "INSERT INTO users (email, password, profile_pic) VALUES ($1, $2, $3) RETURNING *",
            [profile.emails[0].value, "google", profile_pic]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.use(
  "facebook", new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "https://movierater-dac6.onrender.com/auth/facebook/callback",
      profileFields: ["id", "displayName", "emails", "photos"]
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.emails?.[0]?.value,
        ]);
        if (result.rows.length === 0) {
          const profile_pic = profile.photos?.[0]?.value || null;
          const newUser = await db.query(
            "INSERT INTO users (email, password, profile_pic) VALUES ($1, $2, $3) RETURNING *",
            [profile.emails?.[0]?.value || null, "facebook", profile_pic]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.use(
  "github", new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "https://movierater-dac6.onrender.com/auth/github/mymovies",
      profileFields: ["id", "displayName", "emails", "photos"],
       scope: ["user:email"], 
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        if (!profile.emails?.[0]?.value ||profile.emails?.[0]?.value.length === 0) {
        return cb(null, false, {
        message: "Your GitHub account has no public email, try registering with an email address"
  });
}
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.emails?.[0]?.value,
        ]);
        if (result.rows.length === 0) {
          const profile_pic = profile.photos?.[0]?.value || null;
          const newUser = await db.query(
            "INSERT INTO users (email, password, profile_pic) VALUES ($1, $2, $3) RETURNING *",
            [profile.emails?.[0]?.value || null, "github", profile_pic]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

//PROFILE ROUTES

// 1.── GET PUBLIC PROFILE ─────────────────────────────────────
app.get("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Get user
    const userResult = await db.query(
      "SELECT id, username, bio, profile_pic, is_public FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileUser = userResult.rows[0];

    // Check if visitor is following this user (requires token but optional)
    let isFollowing = false;
    const authHeader = req.headers.authorization;
    let visitorId = null;

    if (authHeader) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
        visitorId = decoded.id;
        const followCheck = await db.query(
          "SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2",
          [visitorId, profileUser.id]
        );
        isFollowing = followCheck.rows.length > 0;
      } catch (_) {}
    }

    // Follower / following counts (always visible)
    const followerCount = await db.query(
      "SELECT COUNT(*) FROM follows WHERE following_id = $1",
      [profileUser.id]
    );
    const followingCount = await db.query(
      "SELECT COUNT(*) FROM follows WHERE follower_id = $1",
      [profileUser.id]
    );

    // If private and visitor is not following → return limited profile
    if (!profileUser.is_public && !isFollowing && visitorId !== profileUser.id) {
      return res.json({
        id:            profileUser.id,
        username:      profileUser.username,
        profile_pic:   profileUser.profile_pic,
        is_public:     false,
        isFollowing,
        followerCount: parseInt(followerCount.rows[0].count),
        followingCount:parseInt(followingCount.rows[0].count),
        locked:        true, // frontend uses this to show "follow to see feed"
      });
    }

    // Public profile or follower — return full stats
    const totalMovies = await db.query(
      "SELECT COUNT(*) FROM movies WHERE user_id = $1",
      [profileUser.id]
    );

    const avgRating = await db.query(
      "SELECT ROUND(AVG(my_rating)) as avg FROM movies WHERE user_id = $1",
      [profileUser.id]
    );

    const top3 = await db.query(
      `SELECT id, title, poster_path, my_rating, tmdb_rating, release_date
       FROM movies WHERE user_id = $1
       ORDER BY my_rating DESC LIMIT 3`,
      [profileUser.id]
    );

    const recentlyWatched = await db.query(
      `SELECT id, title, poster_path, my_rating, tmdb_rating, watched_month, watched_year
       FROM movies WHERE user_id = $1
       ORDER BY watched_year DESC, watched_month DESC LIMIT 3`,
      [profileUser.id]
    );

    const recentActivity = await db.query(
      `SELECT a.type, a.created_at, m.title, m.poster_path, m.my_rating
       FROM activities a
       JOIN movies m ON a.movie_id = m.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC LIMIT 10`,
      [profileUser.id]
    );

    res.json({
      id:              profileUser.id,
      username:        profileUser.username,
      bio:             profileUser.bio,
      profile_pic:     profileUser.profile_pic,
      is_public:       profileUser.is_public,
      isFollowing,
      followerCount:   parseInt(followerCount.rows[0].count),
      followingCount:  parseInt(followingCount.rows[0].count),
      locked:          false,
      stats: {
        totalMovies:   parseInt(totalMovies.rows[0].count),
        avgRating:     parseInt(avgRating.rows[0].avg) || 0,
      },
      top3:            top3.rows,
      recentlyWatched: recentlyWatched.rows,
      recentActivity:  recentActivity.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load profile" });
  }
});

// 2.── UPDATE PROFILE ─────────────────────────────────────────
app.put("/profile/edit", verifyToken, async (req, res) => {
  const { username, bio, profile_pic } = req.body;

  try {
    // Check username isn't taken by someone else
    if (username) {
      const taken = await db.query(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        [username, req.user.id]
      );
      if (taken.rows.length > 0) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const result = await db.query(
      `UPDATE users SET
        username   = COALESCE($1, username),
        bio        = COALESCE($2, bio),
        profile_pic= COALESCE($3, profile_pic)
       WHERE id = $4 RETURNING id, username, bio, profile_pic, is_public`,
      [username || null, bio || null, profile_pic || null, req.user.id]
    );

    // Return a fresh token with updated username
    const updated = result.rows[0];
    const token = jwt.sign(
      { id: updated.id, email: req.user.email, profile_pic: updated.profile_pic, username: updated.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token, user: updated });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// 3.── TOGGLE PRIVACY ─────────────────────────────────────────
app.put("/profile/privacy", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      "UPDATE users SET is_public = NOT is_public WHERE id = $1 RETURNING is_public",
      [req.user.id]
    );
    res.json({ is_public: result.rows[0].is_public });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update privacy" });
  }
});

//FOLLOW SYTEM (follow/unfollow, followers/following lists, feed, notifications)
// ── FOLLOW A USER ──────────────────────────────────────────
app.post("/follow/:userId", verifyToken, async (req, res) => {
  const followingId = parseInt(req.params.userId);

  if (followingId === req.user.id) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    // Check target user exists
    const userExists = await db.query("SELECT id FROM users WHERE id = $1", [followingId]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.query(
      "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.user.id, followingId]
    );

    // Create notification for the followed user
    await db.query(
      "INSERT INTO notifications (user_id, actor_id, type) VALUES ($1, $2, $3)",
      [followingId, req.user.id, "follow"]
    );

    res.json({ success: true, following: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to follow user" });
  }
});

// ── UNFOLLOW A USER ────────────────────────────────────────
app.delete("/follow/:userId", verifyToken, async (req, res) => {
  const followingId = parseInt(req.params.userId);

  try {
    await db.query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
      [req.user.id, followingId]
    );
    res.json({ success: true, following: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to unfollow user" });
  }
});

// ── GET FOLLOWERS ──────────────────────────────────────────
app.get("/followers/:userId", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.profile_pic
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load followers" });
  }
});

// ── GET FOLLOWING ──────────────────────────────────────────
app.get("/following/:userId", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.profile_pic
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load following" });
  }
});

// ── ACTIVITY FEED ──────────────────────────────────────────
app.get("/feed", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = 20;

    const result = await db.query(
      `SELECT a.id, a.type, a.created_at,
              u.username, u.profile_pic,
              m.title, m.poster_path, m.my_rating, m.remarks
       FROM activities a
       JOIN users u ON a.user_id = u.id
       JOIN movies m ON a.movie_id = m.id
       WHERE a.user_id IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       )
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, page * limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load feed" });
  }
});

// ── NOTIFICATIONS ──────────────────────────────────────────
app.get("/notifications", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT n.id, n.type, n.read, n.created_at,
              u.username as actor_username, u.profile_pic as actor_pic
       FROM notifications n
       JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

// ── MARK NOTIFICATIONS READ ────────────────────────────────
app.put("/notifications/read", verifyToken, async (req, res) => {
  try {
    await db.query(
      "UPDATE notifications SET read = true WHERE user_id = $1",
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark notifications read" });
  }
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

