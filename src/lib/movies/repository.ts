import "server-only";

import type { PipelineStage } from "mongoose";
import { connectToDatabase, isMongoConfigured } from "@/lib/db/mongodb";
import {
  getAllMovies,
  findMovieBySlug,
  movieSeedCatalog,
  queryMovies,
} from "./catalog";
import {
  findMovieByExternalSlug,
  queryMoviesFromExternalProviders,
} from "./external";
import { MovieModel } from "./model";
import type { Movie, MovieQuery } from "./types";

let seedPromise: Promise<void> | null = null;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeMovieSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
}

function normalizePosterValue(
  poster: string | null | undefined,
  posterUrl: string | null | undefined,
): string | null {
  const fromPoster = poster?.trim();
  if (fromPoster) {
    return fromPoster;
  }

  const fromPosterUrl = posterUrl?.trim();
  if (fromPosterUrl) {
    return fromPosterUrl;
  }

  return null;
}

function normalizeMovieMedia(movie: Movie): Movie {
  const poster = normalizePosterValue(movie.poster, movie.posterUrl);

  return {
    ...movie,
    poster,
    posterUrl: poster ?? undefined,
  };
}

function normalizeMovieForStore(movie: Movie): Movie {
  const normalized = normalizeMovieMedia(movie);

  return {
    ...normalized,
    slug: normalizeMovieSlug(normalized.slug),
  };
}

function toMovie(record: Record<string, unknown>): Movie {
  const poster = normalizePosterValue(
    typeof record.poster === "string" ? record.poster : undefined,
    typeof record.posterUrl === "string" ? record.posterUrl : undefined,
  );

  return {
    id: String(record.id),
    slug: String(record.slug),
    title: String(record.title),
    year: Number(record.year),
    director: String(record.director),
    runtimeMinutes: Number(record.runtimeMinutes),
    poster,
    posterUrl: poster ?? undefined,
    backdropUrl:
      typeof record.backdropUrl === "string" ? record.backdropUrl : undefined,
    moodLane: String(record.moodLane) as Movie["moodLane"],
    aftertaste: String(record.aftertaste) as Movie["aftertaste"],
    intensity: Number(record.intensity) as Movie["intensity"],
    endingType: String(record.endingType) as Movie["endingType"],
    watchRisk: Array.isArray(record.watchRisk)
      ? (record.watchRisk.map(String) as Movie["watchRisk"])
      : [],
    verdict: String(record.verdict),
    synopsis: String(record.synopsis),
    highlight: Array.isArray(record.highlight)
      ? record.highlight.map(String)
      : [],
  };
}

async function syncSeedMoodLanes() {
  const updates = movieSeedCatalog.map((movie) => ({
    updateOne: {
      filter: { id: movie.id },
      update: { $set: { moodLane: movie.moodLane } },
      upsert: false,
    },
  }));

  if (updates.length > 0) {
    await MovieModel.bulkWrite(updates, { ordered: false });
  }
}

async function ensureSeedCatalog() {
  if (seedPromise) {
    await seedPromise;
    return;
  }

  seedPromise = (async () => {
    const existingCount = await MovieModel.countDocuments().exec();
    if (existingCount > 0) {
      await syncSeedMoodLanes();
      return;
    }

    await MovieModel.insertMany(movieSeedCatalog, { ordered: true });
  })().finally(() => {
    seedPromise = null;
  });

  await seedPromise;
}

async function runWithFallback<T>(
  mongoOperation: () => Promise<T>,
  fallbackOperation: () => T | Promise<T>,
): Promise<T> {
  if (!isMongoConfigured()) {
    return await fallbackOperation();
  }

  try {
    const connection = await connectToDatabase();
    if (!connection) {
      return await fallbackOperation();
    }

    await ensureSeedCatalog();
    return await mongoOperation();
  } catch (error) {
    console.error("[movies] Mongo unavailable, using in-memory catalog.", error);
    return await fallbackOperation();
  }
}

async function upsertMovieFromExternal(movie: Movie): Promise<Movie> {
  const normalizedMovie = normalizeMovieForStore(movie);

  const savedMovie = await MovieModel.findOneAndUpdate(
    { id: normalizedMovie.id },
    { $set: normalizedMovie },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  )
    .lean()
    .exec();

  if (!savedMovie) {
    return normalizedMovie;
  }

  return toMovie(savedMovie as Record<string, unknown>);
}

export async function queryMoviesFromStore(query: MovieQuery = {}): Promise<Movie[]> {
  const externalMovies = await queryMoviesFromExternalProviders(query);
  if (externalMovies.length > 0) {
    return externalMovies.map(normalizeMovieMedia);
  }

  return runWithFallback(
    async () => {
      const filter: Record<string, unknown> = {};

      if (query.mood) {
        filter.moodLane = query.mood;
      }

      if (query.endingType) {
        filter.endingType = query.endingType;
      }

      if (query.maxIntensity) {
        filter.intensity = { $lte: query.maxIntensity };
      }

      const normalizedSearch = query.search?.trim();
      if (normalizedSearch) {
        const safeRegex = new RegExp(escapeRegex(normalizedSearch), "i");
        filter.$or = [
          { title: safeRegex },
          { director: safeRegex },
          { synopsis: safeRegex },
          { verdict: safeRegex },
          { highlight: safeRegex },
        ];
      }

      let cursor = MovieModel.find(filter).sort({ year: -1, title: 1 }).lean();

      if (query.limit && query.limit > 0) {
        cursor = cursor.limit(query.limit);
      }

      const movies = await cursor.exec();
      return movies.map((movie) => toMovie(movie as Record<string, unknown>));
    },
    () => queryMovies(query).map(normalizeMovieMedia),
  );
}

export async function findMovieBySlugFromStore(
  slug: string,
): Promise<Movie | undefined> {
  const normalizedSlug = normalizeMovieSlug(slug);

  return runWithFallback(
    async () => {
      const localMovie = await MovieModel.findOne({ slug: normalizedSlug })
        .lean()
        .exec();

      if (localMovie) {
        return toMovie(localMovie as Record<string, unknown>);
      }

      const externalMovie = await findMovieByExternalSlug(normalizedSlug);
      if (!externalMovie) {
        return undefined;
      }

      return upsertMovieFromExternal(externalMovie);
    },
    async () => {
      const localMovie = findMovieBySlug(normalizedSlug);
      if (localMovie) {
        return normalizeMovieMedia(localMovie);
      }

      const externalMovie = await findMovieByExternalSlug(normalizedSlug);
      return externalMovie ? normalizeMovieForStore(externalMovie) : undefined;
    },
  );
}

export async function randomMovieFromStore(
  options: { excludeSlug?: string } = {},
): Promise<Movie | null> {
  const excludeSlug = options.excludeSlug?.trim().toLowerCase();

  return runWithFallback(
    async () => {
      const pipeline: PipelineStage[] = [];

      if (excludeSlug) {
        pipeline.push({
          $match: {
            $expr: {
              $ne: [{ $toLower: "$slug" }, excludeSlug],
            },
          },
        });
      }

      pipeline.push({
        $sample: { size: 1 },
      });

      const sampled = (await MovieModel.aggregate(pipeline).exec()) as Array<
        Record<string, unknown>
      >;
      const movie = sampled[0];

      if (!movie) {
        return null;
      }

      return toMovie(movie);
    },
    () => {
      const candidates = getAllMovies().filter((movie) =>
        excludeSlug ? movie.slug !== excludeSlug : true,
      );

      if (candidates.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * candidates.length);
      return normalizeMovieMedia(candidates[randomIndex]);
    },
  );
}
