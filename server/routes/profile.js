import express from "express";
import jwt from "jsonwebtoken";

import db from "../db.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

//PROFILE ROUTES

// 1.── GET PUBLIC PROFILE ─────────────────────────────────────
router.get("/profile/:username", async (req, res) => {
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
router.put("/profile/edit", verifyToken, async (req, res) => {
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
router.put("/profile/privacy", verifyToken, async (req, res) => {
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

//FOLLOW SYTEM ROUTES (follow/unfollow, followers/following lists, feed, notifications)
// ── FOLLOW A USER ──────────────────────────────────────────
router.post("/follow/:userId", verifyToken, async (req, res) => {
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
router.delete("/follow/:userId", verifyToken, async (req, res) => {
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
router.get("/followers/:userId", async (req, res) => {
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
router.get("/following/:userId", async (req, res) => {
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
router.get("/feed", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = 20;

    // Movie activities from people you follow
    const movieActivity = await db.query(
      `SELECT 
        'activity' as feed_type,
        a.id, a.type, a.created_at,
        u.id as actor_id, u.username, u.profile_pic,
        m.title, m.poster_path, m.my_rating, m.remarks,
        NULL as follower_username, NULL as follower_pic
       FROM activities a
       JOIN users u ON a.user_id = u.id
       JOIN movies m ON a.movie_id = m.id
       WHERE a.user_id IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       )`,
      [req.user.id]
    );

    // New followers of people you follow
    const followActivity = await db.query(
      `SELECT
        'follow' as feed_type,
        f.id, 'followed' as type, f.created_at,
        u.id as actor_id, u.username, u.profile_pic,
        NULL as title, NULL as poster_path, NULL as my_rating, NULL as remarks,
        uf.username as follower_username, uf.profile_pic as follower_pic
       FROM follows f
       JOIN users u ON f.following_id = u.id
       JOIN users uf ON f.follower_id = uf.id
       WHERE f.following_id IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       )
       AND f.follower_id != $1`,
      [req.user.id]
    );

    // Merge, sort by date, paginate
    const combined = [...movieActivity.rows, ...followActivity.rows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(page * limit, (page + 1) * limit);

    res.json(combined);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load feed" });
  }
});

// ── NOTIFICATIONS ──────────────────────────────────────────
router.get("/notifications", verifyToken, async (req, res) => {
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

//user search
router.get("/search/users", verifyToken, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);

  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.profile_pic, u.bio, u.is_public,
              COUNT(DISTINCT f1.follower_id) as follower_count,
              MAX(CASE WHEN f2.follower_id = $1 THEN 1 ELSE 0 END) as is_following
       FROM users u
       LEFT JOIN follows f1 ON f1.following_id = u.id
       LEFT JOIN follows f2 ON f2.following_id = u.id AND f2.follower_id = $1
       WHERE u.username ILIKE $2 AND u.id != $1
       GROUP BY u.id
       ORDER BY follower_count DESC
       LIMIT 10`,
      [req.user.id, `%${q.trim()}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search failed" });
  }
});

// ── MARK NOTIFICATIONS READ ────────────────────────────────
router.put("/notifications/read", verifyToken, async (req, res) => {
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
//unread notifications count for showing red dot on bell icon
router.get("/notifications/unread-count", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false",
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: "Failed to get count" });
  }
});

export default router;