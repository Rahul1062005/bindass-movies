import mongoose from "mongoose";

const LEGACY_TMDB_POSTER_SEGMENT = "/t/p/w500/";
const HIGH_RES_TMDB_POSTER_SEGMENT = "/t/p/w780/";
const TMDB_W500_REGEX = /https?:\/\/image\.tmdb\.org\/t\/p\/w500\//i;

function upgradeTmdbPosterUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!TMDB_W500_REGEX.test(trimmed)) {
    return trimmed;
  }

  return trimmed.replace(LEGACY_TMDB_POSTER_SEGMENT, HIGH_RES_TMDB_POSTER_SEGMENT);
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  const mongoDb = process.env.MONGODB_DB || "bindass_movies";

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing.");
  }

  await mongoose.connect(mongoUri, {
    dbName: mongoDb,
    bufferCommands: false,
  });

  const collection = mongoose.connection.db.collection("movies");
  const legacyFilter = {
    $or: [
      { poster: { $regex: "https?://image\\.tmdb\\.org/t/p/w500/", $options: "i" } },
      { posterUrl: { $regex: "https?://image\\.tmdb\\.org/t/p/w500/", $options: "i" } },
    ],
  };

  const candidates = await collection
    .find(legacyFilter, {
      projection: {
        _id: 1,
        slug: 1,
        poster: 1,
        posterUrl: 1,
      },
    })
    .toArray();

  const operations = [];
  const stats = {
    scanned: candidates.length,
    updated: 0,
    unchanged: 0,
  };

  for (const movie of candidates) {
    const currentPoster = typeof movie.poster === "string" ? movie.poster : null;
    const currentPosterUrl =
      typeof movie.posterUrl === "string" ? movie.posterUrl : null;

    const upgradedPoster = upgradeTmdbPosterUrl(currentPoster);
    const upgradedPosterUrl = upgradeTmdbPosterUrl(currentPosterUrl);

    const set = {};

    if (upgradedPoster !== currentPoster) {
      set.poster = upgradedPoster;
    }

    if (upgradedPosterUrl !== currentPosterUrl) {
      set.posterUrl = upgradedPosterUrl;
    }

    if (Object.keys(set).length === 0) {
      stats.unchanged += 1;
      continue;
    }

    operations.push({
      updateOne: {
        filter: { _id: movie._id },
        update: { $set: set },
      },
    });
  }

  if (operations.length > 0) {
    const result = await collection.bulkWrite(operations, { ordered: false });
    stats.updated = result.modifiedCount;
  }

  const remainingLegacy = await collection.countDocuments(legacyFilter);

  console.log("[upgrade-tmdb-poster-size] Done", {
    ...stats,
    remainingLegacy,
  });

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("[upgrade-tmdb-poster-size] Fatal error:", error);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  process.exitCode = 1;
});
