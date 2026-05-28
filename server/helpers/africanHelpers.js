import axios from "axios";
import { ALL_AFRICA, AFRICAN_COUNTRIES_ARRAY } from "../config/africanCountries.js";


export async function fetchAfricanMovies(tmdbParams, countryCodes) {
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };

  const [r1, r2] = await Promise.all([
    axios.get("https://api.themoviedb.org/3/discover/movie", {
      params: { ...tmdbParams, with_origin_country: countryCodes },
      headers,
    }),
    axios.get("https://api.themoviedb.org/3/discover/movie", {
      params: { ...tmdbParams, with_production_country: countryCodes },
      headers,
    }),
  ]);

  // Merge and deduplicate by id
  const merged = [...r1.data.results, ...r2.data.results]
    .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);

  // Sort based on query intent
  if (tmdbParams.sort_by === "vote_average.desc") {
    merged.sort((a, b) => b.vote_average - a.vote_average);
  } else {
    merged.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
  }

  return {
    movies:        merged,
    total_results: merged.length,
    total_pages:   Math.max(r1.data.total_pages, r2.data.total_pages),
  };
}
//helper fxn to get country codes for african cinema routes
export function getCountryCodes(country) {
  const TAB_MAP = {
    all: ALL_AFRICA,
    NG:  "NG",
    CM:  "CM",
    ZA:  "ZA",
    GH:  "GH",
    EG:  "EG",
  };
  return TAB_MAP[country] || ALL_AFRICA;
}