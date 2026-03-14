import mongoose from "mongoose";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w780";
const TMDB_SEARCH_BASE = "https://api.themoviedb.org/3/search/movie";

function isValidPosterUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function buildPosterUrl(posterPath) {
  if (typeof posterPath !== "string") {
    return null;
  }

  const normalized = posterPath.trim();
  if (!normalized) {
    return null;
  }

  const safePath = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${TMDB_IMAGE_BASE}${safePath}`;
}

function parseReleaseYear(releaseDate) {
  if (typeof releaseDate !== "string") {
    return null;
  }

  const year = Number.parseInt(releaseDate.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

async function searchTmdbByTitleAndYear({ title, year, apiKey }) {
  const params = new URLSearchParams({
    api_key: apiKey,
    query: title,
    include_adult: "false",
    language: "en-US",
    page: "1",
  });

  if (Number.isFinite(year)) {
    params.set("year", String(year));
  }

  const response = await fetch(`${TMDB_SEARCH_BASE}?${params.toString()}`);
  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const results = Array.isArray(payload?.results) ? payload.results : [];
  if (results.length === 0) {
    return null;
  }

  const sameYearResults = Number.isFinite(year)
    ? results.filter((item) => parseReleaseYear(item?.release_date) === year)
    : [];

  const rankedResults = sameYearResults.length > 0 ? sameYearResults : results;
  const picked = rankedResults.find((item) => buildPosterUrl(item?.poster_path));

  return picked ? buildPosterUrl(picked.poster_path) : null;
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  const mongoDb = process.env.MONGODB_DB || "bindass_movies";
  const tmdbApiKey = process.env.TMDB_API_KEY;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing.");
  }

  if (!tmdbApiKey) {
    throw new Error("TMDB_API_KEY is missing.");
  }

  await mongoose.connect(mongoUri, {
    dbName: mongoDb,
    bufferCommands: false,
  });

  const collection = mongoose.connection.db.collection("movies");

  const candidates = await collection
    .find(
      {
        $or: [
          { poster: null },
          { poster: { $exists: false } },
          { poster: "" },
        ],
      },
      {
        projection: {
          _id: 1,
          slug: 1,
          title: 1,
          year: 1,
          poster: 1,
          posterUrl: 1,
        },
      },
    )
    .toArray();

  const stats = {
    scanned: candidates.length,
    updatedFromTmdb: 0,
    copiedExistingPosterUrl: 0,
    skippedAlreadyValid: 0,
    skippedNoMatch: 0,
    errors: 0,
  };

  for (const movie of candidates) {
    try {
      const title = typeof movie.title === "string" ? movie.title.trim() : "";
      const year = Number.isFinite(movie.year) ? movie.year : undefined;
      const currentPoster = typeof movie.poster === "string" ? movie.poster.trim() : "";
      const currentPosterUrl =
        typeof movie.posterUrl === "string" ? movie.posterUrl.trim() : "";

      if (isValidPosterUrl(currentPoster)) {
        stats.skippedAlreadyValid += 1;
        continue;
      }

      if (isValidPosterUrl(currentPosterUrl)) {
        await collection.updateOne(
          { _id: movie._id },
          { $set: { poster: currentPosterUrl, posterUrl: currentPosterUrl } },
        );

        stats.copiedExistingPosterUrl += 1;
        continue;
      }

      if (!title) {
        stats.skippedNoMatch += 1;
        continue;
      }

      const tmdbPoster = await searchTmdbByTitleAndYear({
        title,
        year,
        apiKey: tmdbApiKey,
      });

      if (!tmdbPoster) {
        stats.skippedNoMatch += 1;
        continue;
      }

      await collection.updateOne(
        { _id: movie._id },
        { $set: { poster: tmdbPoster, posterUrl: tmdbPoster } },
      );

      stats.updatedFromTmdb += 1;
    } catch (error) {
      stats.errors += 1;
      console.error(
        `[backfill-posters] Failed for slug=${String(movie.slug)}:`,
        error,
      );
    }
  }

  console.log("[backfill-posters] Done", stats);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("[backfill-posters] Fatal error:", error);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  process.exitCode = 1;
});
