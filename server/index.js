import express from "express";
import dotenv from "dotenv";
import pg from "pg";
import bodyParser from "body-parser";
import axios from "axios";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth20";
import FacebookStrategy from "passport-facebook";
import GitHubStrategy from "passport-github2";
import session from "express-session";
import cors from "cors";

dotenv.config();

const app = express();
const port = 3000;
const saltRounds = 10;
const allowedOrigins = [
  "http://localhost:5173",
  "https://movie-rater-a8gchp8z6-philipe-wang-s-projects.vercel.app"
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
       secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production"
    ? "none"
    : "lax"
    }
  })
);
app.set("trust proxy", 1);

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

db.connect();

app.use(passport.initialize());
app.use(passport.session());


app.get("/movies", async (req, res) => {

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {

    const { sort } = req.query;

    let orderBy = "id DESC";

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

app.post("/add", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
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

    res.json({ success: true });

  } catch (err) {
    console.error("ADD MOVIE ERROR:", err);
    res.status(500).json({ message: "Failed to add movie" });
  }
});

app.post("/edit", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

  res.json({ success: true });
});

app.post("/delete", async (req, res) => {

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { movieId } = req.body;

  await db.query(
    "DELETE FROM movies WHERE id = $1 AND user_id = $2",
    [movieId, req.user.id]
  );

  res.json({ success: true });
});

app.get(
  "/auth/google/mymovies",
  passport.authenticate("google", {
    failureRedirect: "/login",
    scope: ["profile", "email"],
  }),
  (req, res) => {
    res.redirect("http://localhost:5173/home");
  }
);


app.get("/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("http://localhost:5173/home");
  }
);
 app.get("/auth/github/mymovies",
  passport.authenticate("github", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("http://localhost:5173/home");
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

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({
          message: "Login failed",
        });
      }

      return res.status(200).json({
        message: "Login successful",
        user,
      });
    });
  })(req, res, next);
});
app.post("/register", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

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
        "INSERT INTO users (email, password, profile_pic) VALUES ($1, $2, $3) RETURNING *",
        [email, hash, null]
      );

      const user = result.rows[0];

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({
            message: "Login failed",
          });
        }

        return res.status(201).json({
          message: "User registered successfully",
          user,
        });
      });
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Server error",
    });
  }
});


import { Strategy as LocalStrategy } from "passport-local";

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
      callbackURL: "http://localhost:3000/auth/google/mymovies",
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
      callbackURL: "http://localhost:3000/auth/facebook/callback",
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
      callbackURL: "http://localhost:3000/auth/github/mymovies",
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

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});


passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return cb(null, false); // user not found
    }

    cb(null, result.rows[0]);
  } catch (err) {
    cb(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

