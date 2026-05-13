import { useState } from "react";

import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  TextField,
  Box
} from "@mui/material";

import "./MovieCard.css";

function MovieCard({ movie }) {
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    my_rating: movie.my_rating,
    watched_month: movie.watched_month,
    watched_year: movie.watched_year,
    remarks: movie.remarks || ""
  });

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleEditSubmit(event) {
    event.preventDefault();

    console.log("Updated movie:", formData);

    // later:
    // axios.put(...)
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this movie?"
    );

    if (!confirmed) return;

    console.log("Deleting movie...");
  }

  return (
    <Card className="movie-card" elevation={6}>

      {movie.poster_path && (
        <CardMedia
          component="img"
          height="500"
          image={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
        />
      )}

      <CardContent>

        <Typography
          variant="h5"
          fontWeight="bold"
          gutterBottom
        >
          {movie.title}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          <strong>Watched:</strong>{" "}
          {months[movie.watched_month - 1]},
          {" "}
          {movie.watched_year}
        </Typography>

        <Typography
          variant="body2"
          sx={{ mt: 1 }}
        >
          <strong>Release Date:</strong>{" "}
          {new Date(
            movie.release_date
          ).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric"
          })}
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 2
          }}
        >
          <Chip
            label={`TMDB: ${movie.tmdb_rating}`}
          />

          <Chip
            color="success"
            label={`Mine: ${movie.my_rating}`}
          />
        </Box>

        {movie.remarks && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            {movie.remarks}
          </Typography>
        )}

      </CardContent>

      <CardActions>

        {!editing ? (
          <>
            <Button
              variant="outlined"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>

            <Button
              color="error"
              variant="outlined"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </>
        ) : (
          <Box
            component="form"
            onSubmit={handleEditSubmit}
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1
            }}
          >

            <TextField
              label="My Rating"
              name="my_rating"
              type="number"
              value={formData.my_rating}
              onChange={handleChange}
              size="small"
            />

            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                label="Month"
                name="watched_month"
                type="number"
                value={formData.watched_month}
                onChange={handleChange}
                size="small"
              />

              <TextField
                label="Year"
                name="watched_year"
                type="number"
                value={formData.watched_year}
                onChange={handleChange}
                size="small"
              />
            </Box>

            <TextField
              label="Remarks"
              name="remarks"
              multiline
              rows={3}
              value={formData.remarks}
              onChange={handleChange}
              size="small"
            />

            <Button
              type="submit"
              variant="contained"
            >
              Done
            </Button>

          </Box>
        )}

      </CardActions>
    </Card>
  );
}

export default MovieCard;