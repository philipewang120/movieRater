//express server
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";

//passport config
import "./config/passport.js";

//import routes
import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import profileRoutes from "./routes/profile.js";
import africanRoutes from "./routes/african.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

const allowedOrigins = [
  "https://elegant-axolotl-df6c24.netlify.app",
];

app.set("trust proxy", 1);

//middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(passport.initialize());

//health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

//routes
app.use("/", authRoutes);
app.use("/", movieRoutes);
app.use("/", profileRoutes);
app.use("/", africanRoutes);
app.use("/admin", adminRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
