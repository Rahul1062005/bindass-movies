import {
  intensityLevels,
  moodLanes,
  type IntensityLevel,
  type MoodLane,
} from "./types";

export const trackingStatuses = [
  { key: "planToWatch", label: "Plan to Watch" },
  { key: "watching", label: "Watching" },
  { key: "watched", label: "Watched" },
  { key: "favorite", label: "Favorite" },
] as const;

export const movieRatingValues = [1, 2, 3, 4, 5] as const;

export type TrackingStatusKey = (typeof trackingStatuses)[number]["key"];
export type MovieRating = (typeof movieRatingValues)[number];

export type MovieActivityEvent = {
  movieId: string;
  title: string;
  action: string;
  time: string;
};

export type TrackedMovieInput = {
  id: string;
  slug: string;
  title: string;
  year: number;
  poster?: string | null;
  moodLane?: MoodLane;
  intensity?: IntensityLevel;
};

export type StoredMovieRecord = TrackedMovieInput & {
  status?: TrackingStatusKey;
  rating?: MovieRating;
  updatedAt: number;
};

export type TrackedMovie = StoredMovieRecord & {
  status: TrackingStatusKey;
};

export type ViewingStatistics = {
  totalTracked: number;
  totalWatched: number;
  totalPlanToWatch: number;
  totalWatching: number;
  totalFavorite: number;
  averageWatchedIntensity: number | null;
  mostCommonWatchedMoodLane: MoodLane | null;
};

const STORAGE_KEY = "bindass-movie-tracking:v1";
const ACTIVITY_STORAGE_KEY = "bindass-movie-activity:v1";
const TRACKING_UPDATED_EVENT = "bindass-movie-tracking-updated";
const trackingStatusKeySet = new Set<string>(
  trackingStatuses.map((entry) => entry.key),
);
const movieRatingSet = new Set<number>(movieRatingValues);
const moodLaneSet = new Set<string>(moodLanes);
const intensityLevelSet = new Set<number>(intensityLevels);
const statusActionByKey: Record<TrackingStatusKey, string> = {
  planToWatch: "Added to Plan to Watch",
  watching: "Marked as Watching",
  watched: "Marked as Watched",
  favorite: "Added to Favorites",
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
}

function normalizePoster(poster: unknown): string | null {
  if (typeof poster !== "string") {
    return null;
  }

  const trimmed = poster.trim();
  return trimmed ? trimmed : null;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isTrackingStatusKey(value: unknown): value is TrackingStatusKey {
  return typeof value === "string" && trackingStatusKeySet.has(value);
}

function isMovieRating(value: unknown): value is MovieRating {
  return typeof value === "number" && movieRatingSet.has(value);
}

function isMoodLane(value: unknown): value is MoodLane {
  return typeof value === "string" && moodLaneSet.has(value);
}

function isIntensityLevel(value: unknown): value is IntensityLevel {
  return typeof value === "number" && intensityLevelSet.has(value);
}

function toMovieActivityEvent(value: unknown): MovieActivityEvent | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const movieId = typeof record.movieId === "string" ? record.movieId.trim() : "";
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const action = typeof record.action === "string" ? record.action.trim() : "";
  const time = typeof record.time === "string" ? record.time.trim() : "";

  if (!movieId || !title || !action || !time) {
    return null;
  }

  if (!Number.isFinite(Date.parse(time))) {
    return null;
  }

  return {
    movieId,
    title,
    action,
    time,
  };
}

function toStoredMovieRecord(value: unknown): StoredMovieRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const status = isTrackingStatusKey(record.status)
    ? record.status
    : undefined;
  const rating = isMovieRating(record.rating)
    ? record.rating
    : undefined;
  const moodLane = isMoodLane(record.moodLane)
    ? record.moodLane
    : undefined;
  const intensity = isIntensityLevel(record.intensity)
    ? record.intensity
    : undefined;

  if (!status && !rating) {
    return null;
  }

  const slug = typeof record.slug === "string" ? normalizeSlug(record.slug) : "";
  const title = typeof record.title === "string" ? record.title.trim() : "";

  if (!slug || !title) {
    return null;
  }

  const id = typeof record.id === "string" ? record.id.trim() : slug;
  const year = Number(record.year);
  const updatedAtCandidate = Number(record.updatedAt);

  return {
    id: id || slug,
    slug,
    title,
    year: Number.isFinite(year) ? Math.round(year) : new Date().getFullYear(),
    poster: normalizePoster(record.poster),
    status,
    rating,
    moodLane,
    intensity,
    updatedAt:
      Number.isFinite(updatedAtCandidate) && updatedAtCandidate > 0
        ? updatedAtCandidate
        : Date.now(),
  };
}

function readTrackingMap(): Record<string, StoredMovieRecord> {
  if (!canUseStorage()) {
    return {};
  }

  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return {};
  }

  if (!raw) {
    return {};
  }

  const parsed = parseJson(raw);
  if (!parsed || typeof parsed !== "object") {
    return {};
  }

  const values = Array.isArray(parsed)
    ? parsed
    : Object.values(parsed as Record<string, unknown>);
  const map: Record<string, StoredMovieRecord> = {};

  for (const value of values) {
    const storedRecord = toStoredMovieRecord(value);
    if (storedRecord) {
      map[storedRecord.slug] = storedRecord;
    }
  }

  return map;
}

function writeTrackingMap(map: Record<string, StoredMovieRecord>) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(TRACKING_UPDATED_EVENT));
  } catch {
    // Silently ignore storage failures and keep the UI responsive.
  }
}

function readMovieActivityEvents(): MovieActivityEvent[] {
  if (!canUseStorage()) {
    return [];
  }

  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
  } catch {
    return [];
  }

  if (!raw) {
    return [];
  }

  const parsed = parseJson(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map(toMovieActivityEvent)
    .filter((event): event is MovieActivityEvent => event !== null);
}

function writeMovieActivityEvents(events: MovieActivityEvent[]) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent(TRACKING_UPDATED_EVENT));
  } catch {
    // Silently ignore storage failures and keep the UI responsive.
  }
}

function appendMovieStatusActivity(
  movie: TrackedMovieInput,
  status: TrackingStatusKey,
) {
  const movieId = movie.id.trim() || normalizeSlug(movie.slug);
  const title = movie.title.trim();

  if (!movieId || !title) {
    return;
  }

  const events = readMovieActivityEvents();

  events.push({
    movieId,
    title,
    action: statusActionByKey[status],
    time: new Date().toISOString(),
  });

  const MAX_EVENTS = 300;
  const trimmedEvents = events.length > MAX_EVENTS
    ? events.slice(events.length - MAX_EVENTS)
    : events;

  writeMovieActivityEvents(trimmedEvents);
}

function sortMovieActivityEvents(
  events: MovieActivityEvent[],
): MovieActivityEvent[] {
  return [...events].sort((a, b) => {
    const timeA = Date.parse(a.time);
    const timeB = Date.parse(b.time);

    if (timeB !== timeA) {
      return timeB - timeA;
    }

    return b.movieId.localeCompare(a.movieId);
  });
}

export function getTrackingStatusLabel(status: TrackingStatusKey): string {
  const match = trackingStatuses.find((entry) => entry.key === status);
  return match ? match.label : status;
}

export function getTrackedMovieBySlug(slug: string): TrackedMovie | undefined {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return undefined;
  }

  const map = readTrackingMap();
  const storedRecord = map[normalizedSlug];

  if (!storedRecord || !storedRecord.status) {
    return undefined;
  }

  return {
    ...storedRecord,
    status: storedRecord.status,
  };
}

export function getMovieRatingBySlug(slug: string): MovieRating | undefined {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return undefined;
  }

  const map = readTrackingMap();
  return map[normalizedSlug]?.rating;
}

export function getTrackedMovies(): TrackedMovie[] {
  const map = readTrackingMap();
  const trackedMovies = Object.values(map)
    .filter((movie): movie is TrackedMovie => Boolean(movie.status))
    .map((movie) => ({
      ...movie,
      status: movie.status,
    }));

  return trackedMovies.sort((a, b) => {
    if (b.updatedAt !== a.updatedAt) {
      return b.updatedAt - a.updatedAt;
    }

    return a.title.localeCompare(b.title);
  });
}

export function getRecentMovieActivity(limit = 10): MovieActivityEvent[] {
  const normalizedLimit =
    Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;

  const sorted = sortMovieActivityEvents(readMovieActivityEvents());
  return sorted.slice(0, normalizedLimit);
}

export function getTrackingStatistics(): ViewingStatistics {
  const map = readTrackingMap();
  const trackedMovies = Object.values(map).filter(
    (movie): movie is TrackedMovie => Boolean(movie.status),
  );

  const watchedMovies = trackedMovies.filter(
    (movie) => movie.status === "watched",
  );
  const watchedIntensities = watchedMovies
    .map((movie) => movie.intensity)
    .filter((value): value is IntensityLevel => isIntensityLevel(value));

  const averageWatchedIntensity = watchedIntensities.length > 0
    ? Math.round(
      (watchedIntensities.reduce((sum, value) => sum + value, 0) /
        watchedIntensities.length) * 10,
    ) / 10
    : null;

  const moodCounts = new Map<MoodLane, number>();

  for (const movie of watchedMovies) {
    if (!movie.moodLane) {
      continue;
    }

    moodCounts.set(movie.moodLane, (moodCounts.get(movie.moodLane) ?? 0) + 1);
  }

  const mostCommonWatchedMoodLane = [...moodCounts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0]);
    })
    .at(0)?.[0] ?? null;

  return {
    totalTracked: trackedMovies.length,
    totalWatched: watchedMovies.length,
    totalPlanToWatch: trackedMovies.filter((movie) => movie.status === "planToWatch")
      .length,
    totalWatching: trackedMovies.filter((movie) => movie.status === "watching")
      .length,
    totalFavorite: trackedMovies.filter((movie) => movie.status === "favorite")
      .length,
    averageWatchedIntensity,
    mostCommonWatchedMoodLane,
  };
}

export function setMovieTrackingStatus(
  movie: TrackedMovieInput,
  status: TrackingStatusKey,
): TrackedMovie {
  const normalizedSlug = normalizeSlug(movie.slug);
  const normalizedTitle = movie.title.trim();

  if (!normalizedSlug || !normalizedTitle) {
    throw new Error("Movie slug and title are required for tracking.");
  }

  const map = readTrackingMap();
  const existingRecord = map[normalizedSlug];
  const previousStatus = existingRecord?.status;
  const trackedMovie: TrackedMovie = {
    id: movie.id.trim() || normalizedSlug,
    slug: normalizedSlug,
    title: normalizedTitle,
    year: Number.isFinite(movie.year)
      ? Math.round(movie.year)
      : new Date().getFullYear(),
    poster: normalizePoster(movie.poster),
    status,
    rating: existingRecord?.rating,
    moodLane: movie.moodLane ?? existingRecord?.moodLane,
    intensity: movie.intensity ?? existingRecord?.intensity,
    updatedAt: Date.now(),
  };

  map[normalizedSlug] = trackedMovie;
  writeTrackingMap(map);

  if (previousStatus !== status) {
    appendMovieStatusActivity(trackedMovie, status);
  }

  return trackedMovie;
}

export function clearMovieTrackingStatus(slug: string): void {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return;
  }

  const map = readTrackingMap();
  const existingRecord = map[normalizedSlug];

  if (!existingRecord) {
    return;
  }

  if (existingRecord.rating) {
    map[normalizedSlug] = {
      ...existingRecord,
      status: undefined,
      updatedAt: Date.now(),
    };
  } else {
    delete map[normalizedSlug];
  }

  writeTrackingMap(map);
}

export function setMovieRating(
  movie: TrackedMovieInput,
  rating: MovieRating | null,
): StoredMovieRecord | undefined {
  const normalizedSlug = normalizeSlug(movie.slug);
  const normalizedTitle = movie.title.trim();

  if (!normalizedSlug || !normalizedTitle) {
    throw new Error("Movie slug and title are required for ratings.");
  }

  const map = readTrackingMap();
  const existingRecord = map[normalizedSlug];

  if (rating === null) {
    if (!existingRecord) {
      return undefined;
    }

    if (existingRecord.status) {
      const updatedRecord: StoredMovieRecord = {
        ...existingRecord,
        rating: undefined,
        updatedAt: Date.now(),
      };
      map[normalizedSlug] = updatedRecord;
      writeTrackingMap(map);
      return updatedRecord;
    }

    delete map[normalizedSlug];
    writeTrackingMap(map);
    return undefined;
  }

  if (!isMovieRating(rating)) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const updatedRecord: StoredMovieRecord = {
    id: movie.id.trim() || normalizedSlug,
    slug: normalizedSlug,
    title: normalizedTitle,
    year: Number.isFinite(movie.year)
      ? Math.round(movie.year)
      : new Date().getFullYear(),
    poster: normalizePoster(movie.poster),
    status: existingRecord?.status,
    rating,
    moodLane: movie.moodLane ?? existingRecord?.moodLane,
    intensity: movie.intensity ?? existingRecord?.intensity,
    updatedAt: Date.now(),
  };

  map[normalizedSlug] = updatedRecord;
  writeTrackingMap(map);

  return updatedRecord;
}

export function subscribeToTrackingUpdates(
  listener: () => void,
): () => void {
  if (!canUseStorage()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key &&
      event.key !== STORAGE_KEY &&
      event.key !== ACTIVITY_STORAGE_KEY
    ) {
      return;
    }

    listener();
  };

  const handleManualUpdate: EventListener = () => {
    listener();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(TRACKING_UPDATED_EVENT, handleManualUpdate);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(TRACKING_UPDATED_EVENT, handleManualUpdate);
  };
}