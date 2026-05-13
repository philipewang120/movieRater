import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import MovieCard from "../MovieCard/MovieCard";

function MovieGrid({ movies }) {

  if (!movies || movies.length === 0) {
    return (
      <Typography
        variant="h5"
        textAlign="center"
        sx={{ mt: 8 }}
      >
        No movies have been rated yet 🎬
      </Typography>
    );
  }

  return (
    <Grid
      container
      spacing={4}
    >
      {movies.map((movie) => (
        <Grid
          key={movie.id}
          size={{
            xs: 12,
            sm: 6,
            lg: 4
          }}
        >
          <MovieCard movie={movie} />
        </Grid>
      ))}
    </Grid>
  );
}

export default MovieGrid;