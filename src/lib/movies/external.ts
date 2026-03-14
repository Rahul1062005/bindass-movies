import "server-only";

import type {
  Aftertaste,
  EndingType,
  IntensityLevel,
  MoodLane,
  Movie,
  MovieQuery,
  WatchRiskTag,
} from "./types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const TMDB_POSTER_SIZE = "w780";
const TMDB_BACKDROP_SIZE = "w1280";
const OMDB_BASE_URL = "https://www.omdbapi.com/";
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 20;
const FETCH_TIMEOUT_MS = 9000;

const tmdbGenreNameById: Record<number, string> = {
  12: "adventure",
  14: "fantasy",
  16: "animation",
  18: "drama",
  27: "horror",
  28: "action",
  35: "comedy",
  36: "history",
  37: "western",
  53: "thriller",
  80: "crime",
  878: "science fiction",
  9648: "mystery",
  99: "documentary",
  10402: "music",
  10749: "romance",
  10751: "family",
  10752: "war",
};

type TmdbMovieListItem = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  genre_ids?: number[];
  vote_average?: number;
};

type TmdbListResponse = {
  results?: TmdbMovieListItem[];
};

type TmdbMovieDetail = {
  id: number;
  title?: string;
  release_date?: string;
  overview?: string;
  runtime?: number;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  genres?: Array<{
    id: number;
    name: string;
  }>;
  credits?: {
    crew?: Array<{
      job?: string;
      name?: string;
    }>;
  };
};

type OmdbSearchResponse = {
  Response?: string;
  Search?: Array<{
    Title?: string;
    Year?: string;
    imdbID?: string;
  }>;
};

type OmdbMovieDetail = {
  Response?: string;
  Title?: string;
  Year?: string;
  imdbID?: string;
  Director?: string;
  Runtime?: string;
  Genre?: string;
  Plot?: string;
  imdbRating?: string;
  Poster?: string;
};

type ExternalMovieInput = {
  providerId: string;
  sourceName: "TMDB" | "OMDb";
  title: string;
  year: number;
  director: string;
  runtimeMinutes: number;
  poster?: string | null;
  backdropUrl?: string | null;
  genreNames: Set<string>;
  voteAverage: number;
  synopsis: string;
};

function getTmdbApiKey(): string {
  return process.env.TMDB_API_KEY?.trim() ?? "";
}

function getOmdbApiKey(): string {
  return process.env.OMDB_API_KEY?.trim() ?? "";
}

function buildTmdbImageUrl(
  path: string | undefined,
  size: typeof TMDB_POSTER_SIZE | typeof TMDB_BACKDROP_SIZE,
): string | undefined {
  const normalized = path?.trim();

  if (!normalized) {
    return undefined;
  }

  const safePath = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${TMDB_IMAGE_BASE_URL}/${size}${safePath}`;
}

function normalizeExternalImageUrl(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  if (!normalized || normalized.toUpperCase() === "N/A") {
    return undefined;
  }

  return /^https?:\/\//i.test(normalized) ? normalized : undefined;
}

function normalizeLimit(limit?: number): number {
  if (!limit || limit < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(limit, MAX_LIMIT);
}

function parseYear(value?: string): number {
  const year = Number.parseInt(value?.slice(0, 4) ?? "", 10);

  if (Number.isInteger(year) && year >= 1888 && year <= 2100) {
    return year;
  }

  return new Date().getFullYear();
}

function parseRuntimeMinutes(value: string | number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const match = value.match(/(\d+)/);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return 110;
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/["'`.,!?():]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSlug(title: string, year: number, providerId: string): string {
  const base = slugify(title) || providerId;
  return `${base}-${year}-${providerId.toLowerCase()}`;
}

function hasAnyGenre(genreNames: Set<string>, candidates: string[]): boolean {
  return candidates.some((candidate) => genreNames.has(candidate));
}

function inferMoodLane(genreNames: Set<string>, runtimeMinutes: number): MoodLane {
  if (hasAnyGenre(genreNames, ["horror", "crime"])) {
    return "🌒 Dark Stories";
  }

  if (hasAnyGenre(genreNames, ["thriller"])) {
    return "😰 Edge-of-Seat";
  }

  if (hasAnyGenre(genreNames, ["science fiction", "mystery", "fantasy"])) {
    return "🧠 Mind-Bending";
  }

  if (runtimeMinutes >= 145) {
    return "🔥 Slow Burn";
  }

  if (hasAnyGenre(genreNames, ["action", "adventure", "war", "history", "western"])) {
    return "🏔️ Big Epic";
  }

  if (hasAnyGenre(genreNames, ["romance", "drama"])) {
    return "💖 Emotional";
  }

  if (hasAnyGenre(genreNames, ["comedy", "animation", "family", "music"])) {
    return "☀️ Feel Good";
  }

  return "🤔 Thoughtful";
}

function inferAftertaste(moodLane: MoodLane, voteAverage: number): Aftertaste {
  if (moodLane === "☀️ Feel Good") {
    return voteAverage >= 7 ? "Hopeful" : "Euphoric";
  }

  if (moodLane === "🌒 Dark Stories") {
    return voteAverage < 6 ? "Devastated" : "Unsettled";
  }

  if (moodLane === "😰 Edge-of-Seat") {
    return "Unsettled";
  }

  if (moodLane === "💖 Emotional") {
    return voteAverage >= 7 ? "Bittersweet" : "Reflective";
  }

  if (moodLane === "🏔️ Big Epic") {
    return voteAverage >= 7.4 ? "Euphoric" : "Hopeful";
  }

  if (moodLane === "🔥 Slow Burn") {
    return "Reflective";
  }

  return voteAverage >= 7.8 ? "Reflective" : "Hopeful";
}

function inferEndingType(genreNames: Set<string>): EndingType {
  if (hasAnyGenre(genreNames, ["mystery", "science fiction"])) {
    return "Ambiguous";
  }

  if (hasAnyGenre(genreNames, ["thriller", "crime", "horror"])) {
    return "Twist-driven";
  }

  if (hasAnyGenre(genreNames, ["comedy", "family", "animation"])) {
    return "Resolved";
  }

  if (hasAnyGenre(genreNames, ["drama", "romance"])) {
    return "Open-ended";
  }

  return "Existential";
}

function inferIntensity(
  genreNames: Set<string>,
  runtimeMinutes: number,
): IntensityLevel {
  let score = 2;

  if (hasAnyGenre(genreNames, ["horror", "thriller", "war", "crime"])) {
    score += 2;
  }

  if (hasAnyGenre(genreNames, ["action", "adventure", "western"])) {
    score += 1;
  }

  if (runtimeMinutes >= 150) {
    score += 1;
  }

  if (hasAnyGenre(genreNames, ["comedy", "family", "animation"])) {
    score -= 1;
  }

  const clamped = Math.min(5, Math.max(1, score));
  return clamped as IntensityLevel;
}

function inferWatchRisk(
  genreNames: Set<string>,
  moodLane: MoodLane,
  runtimeMinutes: number,
): WatchRiskTag[] {
  const risks = new Set<WatchRiskTag>();

  if (runtimeMinutes >= 130 || moodLane === "🔥 Slow Burn") {
    risks.add("Slow burn");
  }

  if (moodLane === "💖 Emotional" || hasAnyGenre(genreNames, ["drama", "romance"])) {
    risks.add("Emotional heavy");
  }

  if (hasAnyGenre(genreNames, ["horror", "war", "crime", "action"])) {
    risks.add("Graphic violence");
  }

  if (hasAnyGenre(genreNames, ["thriller", "mystery", "horror"])) {
    risks.add("Psychological tension");
  }

  if (hasAnyGenre(genreNames, ["science fiction", "mystery", "fantasy"])) {
    risks.add("Complex timeline");
  }

  if (moodLane === "🌒 Dark Stories" || hasAnyGenre(genreNames, ["crime", "war"])) {
    risks.add("Bleak themes");
  }

  return Array.from(risks).slice(0, 4);
}

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildHighlights(
  genreNames: Set<string>,
  voteAverage: number,
  runtimeMinutes: number,
  sourceName: string,
): string[] {
  const highlights: string[] = [];
  const genreSnippet = Array.from(genreNames)
    .slice(0, 2)
    .map(toTitleCase)
    .join(" + ");

  if (genreSnippet) {
    highlights.push(`${genreSnippet} blend`);
  }

  if (voteAverage > 0) {
    highlights.push(`${voteAverage.toFixed(1)}/10 community rating`);
  }

  if (runtimeMinutes > 0) {
    highlights.push(`${runtimeMinutes} min runtime`);
  }

  if (highlights.length === 0) {
    highlights.push(`${sourceName} recommendation`);
  }

  return highlights;
}

function buildVerdict(synopsis: string, sourceName: string): string {
  const trimmed = synopsis.trim();
  if (!trimmed) {
    return `${sourceName} recommendation selected for your current filters.`;
  }

  if (trimmed.length <= 140) {
    return trimmed;
  }

  return `${trimmed.slice(0, 137).trimEnd()}...`;
}

function toMovieFromExternal(input: ExternalMovieInput): Movie {
  const moodLane = inferMoodLane(input.genreNames, input.runtimeMinutes);
  const aftertaste = inferAftertaste(moodLane, input.voteAverage);
  const endingType = inferEndingType(input.genreNames);
  const intensity = inferIntensity(input.genreNames, input.runtimeMinutes);

  const synopsis = input.synopsis.trim()
    ? input.synopsis.trim()
    : `No synopsis available from ${input.sourceName}.`;

  return {
    id: input.providerId,
    slug: buildSlug(input.title, input.year, input.providerId),
    title: input.title,
    year: input.year,
    director: input.director,
    runtimeMinutes: input.runtimeMinutes,
    poster: input.poster ?? null,
    posterUrl: input.poster ?? undefined,
    backdropUrl: input.backdropUrl ?? undefined,
    moodLane,
    aftertaste,
    intensity,
    endingType,
    watchRisk: inferWatchRisk(input.genreNames, moodLane, input.runtimeMinutes),
    verdict: buildVerdict(synopsis, input.sourceName),
    synopsis,
    highlight: buildHighlights(
      input.genreNames,
      input.voteAverage,
      input.runtimeMinutes,
      input.sourceName,
    ),
  };
}

function applyMovieQueryFilters(movies: Movie[], query: MovieQuery): Movie[] {
  const normalizedSearch = query.search?.trim().toLowerCase();

  return movies
    .filter((movie) => (query.mood ? movie.moodLane === query.mood : true))
    .filter((movie) =>
      query.endingType ? movie.endingType === query.endingType : true,
    )
    .filter((movie) =>
      query.maxIntensity ? movie.intensity <= query.maxIntensity : true,
    )
    .filter((movie) => {
      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        movie.title,
        movie.director,
        movie.synopsis,
        movie.verdict,
        ...movie.highlight,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    })
    .sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }

      return a.title.localeCompare(b.title);
    });
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getGenreNamesFromTmdb(
  genreIds: number[] | undefined,
  genres: Array<{ id: number; name: string }> | undefined,
): Set<string> {
  const names = new Set<string>();

  for (const genre of genres ?? []) {
    const normalized = genre.name?.trim().toLowerCase();
    if (normalized) {
      names.add(normalized);
    }
  }

  for (const genreId of genreIds ?? []) {
    const normalized = tmdbGenreNameById[genreId];
    if (normalized) {
      names.add(normalized);
    }
  }

  return names;
}

function pickDirector(
  crew: Array<{ job?: string; name?: string }> | undefined,
): string {
  const director = crew?.find((person) => person.job === "Director")?.name;
  return director?.trim() ? director : "Unknown Director";
}

async function fetchTmdbMovieDetail(
  tmdbId: number,
  apiKey: string,
): Promise<TmdbMovieDetail | null> {
  const params = new URLSearchParams({
    api_key: apiKey,
    language: "en-US",
    append_to_response: "credits",
  });

  return fetchJson<TmdbMovieDetail>(
    `${TMDB_BASE_URL}/movie/${tmdbId}?${params.toString()}`,
  );
}

async function toMovieFromTmdbListItem(
  item: TmdbMovieListItem,
  apiKey: string,
): Promise<Movie | null> {
  const tmdbId = item.id;
  if (!Number.isInteger(tmdbId)) {
    return null;
  }

  const detail = await fetchTmdbMovieDetail(tmdbId, apiKey);

  const title = detail?.title ?? item.title ?? item.name ?? "Untitled";
  const year = parseYear(detail?.release_date ?? item.release_date);
  const synopsis = detail?.overview ?? item.overview ?? "";
  const voteAverage = parseNumber(detail?.vote_average ?? item.vote_average, 0);
  const runtimeMinutes = parseRuntimeMinutes(detail?.runtime);
  const director = pickDirector(detail?.credits?.crew);
  const genreNames = getGenreNamesFromTmdb(item.genre_ids, detail?.genres);
  const poster = buildTmdbImageUrl(
    detail?.poster_path ?? item.poster_path,
    TMDB_POSTER_SIZE,
  );
  const backdropUrl = buildTmdbImageUrl(
    detail?.backdrop_path ?? item.backdrop_path,
    TMDB_BACKDROP_SIZE,
  );

  return toMovieFromExternal({
    providerId: `tmdb-${tmdbId}`,
    sourceName: "TMDB",
    title,
    year,
    director,
    runtimeMinutes,
    poster,
    backdropUrl,
    genreNames,
    voteAverage,
    synopsis,
  });
}

async function queryTmdbMovies(query: MovieQuery): Promise<Movie[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    return [];
  }

  const normalizedSearch = query.search?.trim();
  const limit = normalizeLimit(query.limit);
  const candidateLimit = Math.min(limit + 8, MAX_LIMIT);

  const params = new URLSearchParams({
    api_key: apiKey,
    language: "en-US",
    include_adult: "false",
    page: "1",
  });

  let endpoint = `${TMDB_BASE_URL}/discover/movie`;
  if (normalizedSearch) {
    endpoint = `${TMDB_BASE_URL}/search/movie`;
    params.set("query", normalizedSearch);
  } else {
    params.set("sort_by", "popularity.desc");
  }

  const payload = await fetchJson<TmdbListResponse>(
    `${endpoint}?${params.toString()}`,
  );

  const items = payload?.results?.slice(0, candidateLimit) ?? [];
  if (items.length === 0) {
    return [];
  }

  const movies = await Promise.all(
    items.map((item) => toMovieFromTmdbListItem(item, apiKey)),
  );

  const mapped = movies.filter((movie): movie is Movie => movie !== null);
  return applyMovieQueryFilters(mapped, query).slice(0, limit);
}

function parseOmdbGenres(value: string | undefined): Set<string> {
  const names = new Set<string>();

  for (const rawName of value?.split(",") ?? []) {
    const normalized = rawName.trim().toLowerCase();

    if (!normalized || normalized === "n/a") {
      continue;
    }

    if (normalized === "sci-fi") {
      names.add("science fiction");
      continue;
    }

    names.add(normalized);
  }

  return names;
}

async function fetchOmdbMovieDetail(
  imdbId: string,
  apiKey: string,
): Promise<OmdbMovieDetail | null> {
  const params = new URLSearchParams({
    apikey: apiKey,
    i: imdbId,
    plot: "short",
  });

  return fetchJson<OmdbMovieDetail>(`${OMDB_BASE_URL}?${params.toString()}`);
}

async function queryOmdbMovies(query: MovieQuery): Promise<Movie[]> {
  const apiKey = getOmdbApiKey();
  const normalizedSearch = query.search?.trim();

  if (!apiKey || !normalizedSearch) {
    return [];
  }

  const limit = normalizeLimit(query.limit);
  const params = new URLSearchParams({
    apikey: apiKey,
    s: normalizedSearch,
    type: "movie",
    page: "1",
  });

  const payload = await fetchJson<OmdbSearchResponse>(
    `${OMDB_BASE_URL}?${params.toString()}`,
  );

  const items =
    payload?.Response === "True" ? payload.Search?.slice(0, Math.min(limit + 4, 10)) ?? [] : [];

  if (items.length === 0) {
    return [];
  }

  const movies = await Promise.all(
    items.map(async (item): Promise<Movie | null> => {
      const imdbId = item.imdbID?.trim().toLowerCase();
      if (!imdbId) {
        return null;
      }

      const detail = await fetchOmdbMovieDetail(imdbId, apiKey);
      if (!detail || detail.Response !== "True") {
        return null;
      }

      const title = detail.Title?.trim() || item.Title?.trim() || "Untitled";
      const year = parseYear(detail.Year ?? item.Year);
      const director =
        detail.Director && detail.Director !== "N/A"
          ? detail.Director
          : "Unknown Director";
      const runtimeMinutes = parseRuntimeMinutes(detail.Runtime);
      const genreNames = parseOmdbGenres(detail.Genre);
      const voteAverage = parseNumber(detail.imdbRating, 0);
      const synopsis = detail.Plot && detail.Plot !== "N/A" ? detail.Plot : "";
      const poster = normalizeExternalImageUrl(detail.Poster);

      return toMovieFromExternal({
        providerId: `omdb-${imdbId}`,
        sourceName: "OMDb",
        title,
        year,
        director,
        runtimeMinutes,
        poster,
        genreNames,
        voteAverage,
        synopsis,
      });
    }),
  );

  const mapped = movies.filter((movie): movie is Movie => movie !== null);
  return applyMovieQueryFilters(mapped, query).slice(0, limit);
}

async function findTmdbMovieById(tmdbId: number): Promise<Movie | undefined> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    return undefined;
  }

  const detail = await fetchTmdbMovieDetail(tmdbId, apiKey);
  if (!detail) {
    return undefined;
  }

  const title = detail.title ?? "Untitled";
  const year = parseYear(detail.release_date);
  const synopsis = detail.overview ?? "";
  const runtimeMinutes = parseRuntimeMinutes(detail.runtime);
  const voteAverage = parseNumber(detail.vote_average, 0);
  const director = pickDirector(detail.credits?.crew);
  const genreNames = getGenreNamesFromTmdb(undefined, detail.genres);
  const poster = buildTmdbImageUrl(detail.poster_path, TMDB_POSTER_SIZE);
  const backdropUrl = buildTmdbImageUrl(
    detail.backdrop_path,
    TMDB_BACKDROP_SIZE,
  );

  return toMovieFromExternal({
    providerId: `tmdb-${tmdbId}`,
    sourceName: "TMDB",
    title,
    year,
    director,
    runtimeMinutes,
    poster,
    backdropUrl,
    genreNames,
    voteAverage,
    synopsis,
  });
}

async function findOmdbMovieByImdbId(imdbId: string): Promise<Movie | undefined> {
  const apiKey = getOmdbApiKey();
  if (!apiKey) {
    return undefined;
  }

  const detail = await fetchOmdbMovieDetail(imdbId.toLowerCase(), apiKey);
  if (!detail || detail.Response !== "True") {
    return undefined;
  }

  const normalizedImdbId = (detail.imdbID ?? imdbId).toLowerCase();
  const title = detail.Title?.trim() || "Untitled";
  const year = parseYear(detail.Year);
  const director =
    detail.Director && detail.Director !== "N/A"
      ? detail.Director
      : "Unknown Director";
  const runtimeMinutes = parseRuntimeMinutes(detail.Runtime);
  const genreNames = parseOmdbGenres(detail.Genre);
  const voteAverage = parseNumber(detail.imdbRating, 0);
  const synopsis = detail.Plot && detail.Plot !== "N/A" ? detail.Plot : "";
  const poster = normalizeExternalImageUrl(detail.Poster);

  return toMovieFromExternal({
    providerId: `omdb-${normalizedImdbId}`,
    sourceName: "OMDb",
    title,
    year,
    director,
    runtimeMinutes,
    poster,
    genreNames,
    voteAverage,
    synopsis,
  });
}

export async function queryMoviesFromExternalProviders(
  query: MovieQuery = {},
): Promise<Movie[]> {
  const tmdbMovies = await queryTmdbMovies(query);
  if (tmdbMovies.length > 0) {
    return tmdbMovies;
  }

  // Use OMDb only when TMDB returns no usable results.
  return queryOmdbMovies(query);
}

export async function findMovieByExternalSlug(
  slug: string,
): Promise<Movie | undefined> {
  const normalizedSlug = slug.trim().toLowerCase();

  const tmdbMatch = normalizedSlug.match(/-tmdb-(\d+)$/);
  if (tmdbMatch) {
    return findTmdbMovieById(Number.parseInt(tmdbMatch[1], 10));
  }

  const omdbMatch = normalizedSlug.match(/-omdb-(tt\d+)$/);
  if (omdbMatch) {
    return findOmdbMovieByImdbId(omdbMatch[1]);
  }

  return undefined;
}