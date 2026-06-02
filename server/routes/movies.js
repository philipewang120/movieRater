import express from "express";
import axios from "axios";

import db from "../db.js";

import upload from "../config/cloudinary.js";

import { apiLimiter, } from "../middleware/rateLimiters.js";
import {verifyToken,} from "../middleware/auth.js";

import jwt from "jsonwebtoken";

import {
  getPeriodBounds,
  getPreviousAnchorDate,
} from "../helpers/wrappedHelpers.js";

const router = express.Router();

async function fetchTopGenre(movieIds) {
  if (!movieIds.length || !process.env.TMDB_BEARER) return null;

  const counts = {};
  const unique = [...new Set(movieIds)].slice(0, 20);

  await Promise.all(
    unique.map(async (tmdbId) => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${tmdbId}`,
          {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${process.env.TMDB_BEARER}`,
            },
          }
        );
        for (const g of response.data.genres || []) {
          counts[g.name] = (counts[g.name] || 0) + 1;
        }
      } catch {
        /* skip failed TMDB lookups */
      }
    })
  );

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || null;
}

function mapMovieRow(row) {
  return {
    id: row.id,
    tmdb_id: row.movie_id,
    title: row.title,
    poster_path: row.poster_path,
    tmdb_rating: row.tmdb_rating,
    my_rating: row.my_rating,
    release_date: row.release_date,
    watched_month: row.watched_month,
    watched_year: row.watched_year,
  };
}


//get all movies and data from db for specific user
router.get("/movies", verifyToken, apiLimiter, async (req, res) => {

  try {

    const { sort, page = 0, limit = 10 } = req.query;
    const offset = parseInt(page) * parseInt(limit);

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
      const countResult = await db.query(
      "SELECT COUNT(*) FROM movies WHERE user_id = $1",
      [req.user.id]
    );
    const statsResult = await db.query(
  `SELECT 
    ROUND(AVG(my_rating)) as avg_rating,
    (SELECT title FROM movies WHERE user_id = $1 ORDER BY my_rating DESC LIMIT 1) as top_rated_title
   FROM movies WHERE user_id = $1`,
  [req.user.id]
);

   const result = await db.query(
      `SELECT * FROM movies WHERE user_id = $1 ORDER BY ${orderBy} LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), offset]
    );

   res.json({
  movies:          result.rows,
  total:           parseInt(countResult.rows[0].count),
  avg_rating:      parseInt(statsResult.rows[0].avg_rating) || 0,
  top_rated_title: statsResult.rows[0].top_rated_title || null,
  profile_pic:     req.user.profile_pic,
  email:           req.user.email,
});

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load movies" });
  }
});
//search movie by title, case-insensitive
router.get("/movie/:title", async (req, res) => {
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
router.get("/top-movies", async (req, res) => {
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
// User "wrapped" recap for week / month / year
router.get("/movies/wrapped", verifyToken, apiLimiter, async (req, res) => {
  try {
    const period = ["week", "month", "year"].includes(req.query.period)
      ? req.query.period
      : "month";

    const refDate =
      req.query.anchor === "previous"
        ? getPreviousAnchorDate(period, new Date())
        : new Date();
    const bounds = getPeriodBounds(period, refDate);
    let rows = [];

    if (bounds.useActivityWeek) {
      const result = await db.query(
        `SELECT DISTINCT m.*
         FROM movies m
         INNER JOIN activities a
           ON a.movie_id = m.id AND a.user_id = m.user_id
         WHERE m.user_id = $1
           AND a.created_at >= $2
           AND a.created_at < $3
           AND a.type IN ('added', 'edited')
         ORDER BY m.my_rating DESC NULLS LAST`,
        [req.user.id, bounds.weekStart, bounds.weekEnd]
      );
      rows = result.rows;
    } else if (period === "year") {
      const result = await db.query(
        `SELECT * FROM movies
         WHERE user_id = $1 AND watched_year = $2
         ORDER BY my_rating DESC NULLS LAST`,
        [req.user.id, bounds.year]
      );
      rows = result.rows;
    } else {
      const result = await db.query(
        `SELECT * FROM movies
         WHERE user_id = $1 AND watched_year = $2 AND watched_month = $3
         ORDER BY my_rating DESC NULLS LAST`,
        [req.user.id, bounds.year, bounds.month]
      );
      rows = result.rows;
    }

    const rated = rows.filter((r) => r.my_rating != null);
    const totalWatched = rows.length;
    const avgRating =
      rated.length > 0
        ? Math.round(
            rated.reduce((sum, r) => sum + Number(r.my_rating), 0) / rated.length
          )
        : 0;

    const top5 = [...rated]
      .sort((a, b) => Number(b.my_rating) - Number(a.my_rating))
      .slice(0, 5)
      .map(mapMovieRow);

    const worst5 = [...rated]
      .sort((a, b) => Number(a.my_rating) - Number(b.my_rating))
      .slice(0, 5)
      .map(mapMovieRow);

    const topGenre = await fetchTopGenre(rows.map((r) => r.movie_id));

    res.json({
      period: bounds.period,
      periodLabel: bounds.label,
      shortLabel: bounds.shortLabel,
      storageKey: bounds.storageKey,
      totalWatched,
      avgRating,
      topGenre,
      top5,
      worst5,
      username: req.user.username || req.user.email?.split("@")[0] || "you",
    });
  } catch (err) {
    console.error("WRAPPED ERROR:", err);
    res.status(500).json({ message: "Failed to load wrapped" });
  }
});

//ping backend to avoid it going to sleep
router.get("/health", (req, res) => res.json({ status: "ok" }));

router.post("/add", verifyToken, apiLimiter, async (req, res) => {
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

    // Insert movie
    const movieResult = await db.query(
      `
      INSERT INTO movies
      (
        movie_id,
        title,
        release_date,
        watched_month,
        watched_year,
        poster_path,
        remarks,
        tmdb_rating,
        my_rating,
        user_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id
      `,
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

    const addedMovieId = movieResult.rows[0].id;

    // Create activity
    await db.query(
      `
      INSERT INTO activities (user_id, type, movie_id)
      VALUES ($1, $2, $3)
      `,
      [req.user.id, "added", addedMovieId]
    );

    res.json({
      success: true,
      movieId: addedMovieId,
    });

  } catch (err) {
    console.error("ADD MOVIE ERROR:", err);

    res.status(500).json({
      message: "Failed to add movie",
    });
  }
});
router.post("/edit", verifyToken, apiLimiter, async (req, res) => {
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

// upload profile picture, save URL to db, return new token with updated picture URL in payload
router.post("/profile/avatar", verifyToken, apiLimiter, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = req.file.path;

    // Save to database
    await db.query(
      "UPDATE users SET profile_pic = $1 WHERE id = $2",
      [imageUrl, req.user.id]
    );

    // Return fresh token with updated profile pic
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, profile_pic: imageUrl, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, profile_pic: imageUrl, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
});

router.post("/delete", verifyToken, async (req, res) => {
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

export default router;