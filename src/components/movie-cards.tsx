"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  endingTypes,
  moodLanes,
  type Movie,
  type EndingType,
  type MoodLane,
} from "@/lib/movies";
import styles from "./movie-cards.module.css";

type MoviesResponse = {
  count: number;
  movies: Movie[];
};

type MovieCardsLayout = "grid" | "row";

type MovieCardsProps = {
  fixedMood?: MoodLane;
  limit?: number;
  layout?: MovieCardsLayout;
  showControls?: boolean;
  showStatus?: boolean;
  showRowArrows?: boolean;
  maxCards?: number;
  randomizeSelection?: boolean;
  fixedCardCount?: number;
};

const DEFAULT_LIMIT = 12;
const skeletonCount = 6;

function pickRandomMovies(movies: Movie[], count: number): Movie[] {
  if (count <= 0 || movies.length <= count) {
    return movies.slice(0, count > 0 ? count : movies.length);
  }

  const shuffled = [...movies];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, count);
}

export function MovieCards({
  fixedMood,
  limit = DEFAULT_LIMIT,
  layout = "grid",
  showControls = true,
  showStatus = true,
  showRowArrows = false,
  maxCards,
  randomizeSelection = false,
  fixedCardCount,
}: MovieCardsProps = {}) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState<MoodLane | "all">(
    fixedMood ?? "all",
  );
  const [endingTypeFilter, setEndingTypeFilter] = useState<EndingType | "all">(
    "all",
  );
  const [maxIntensityFilter, setMaxIntensityFilter] = useState<
    1 | 2 | 3 | 4 | 5 | "all"
  >("all");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const isRowLayout = layout === "row";

  useEffect(() => {
    if (!fixedMood) {
      return;
    }

    setMoodFilter(fixedMood);
  }, [fixedMood]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: String(limit) });

    if (showControls && search.trim()) {
      params.set("search", search.trim());
    }

    if (fixedMood) {
      params.set("mood", fixedMood);
    } else if (moodFilter !== "all") {
      params.set("mood", moodFilter);
    }

    if (showControls && endingTypeFilter !== "all") {
      params.set("endingType", endingTypeFilter);
    }

    if (showControls && maxIntensityFilter !== "all") {
      params.set("maxIntensity", String(maxIntensityFilter));
    }

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/movies?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Failed to fetch movies.");
        }

        const payload = (await response.json()) as MoviesResponse;
        setMovies(payload.movies);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }

        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    run();

    return () => {
      controller.abort();
    };
  }, [
    endingTypeFilter,
    fixedMood,
    limit,
    maxIntensityFilter,
    moodFilter,
    search,
    showControls,
  ]);

  const statusText = useMemo(() => {
    if (loading) {
      return showControls ? "Loading your movie cards..." : "Loading movies...";
    }

    if (error) {
      return `Could not load movies: ${error}`;
    }

    if (movies.length === 0) {
      return showControls
        ? "No movie matched this filter set. Try loosening a filter."
        : "No movies found for this mood lane.";
    }

    return `${movies.length} movies loaded from your API`;
  }, [error, loading, movies.length, showControls]);

  const visibleMovies = useMemo(() => {
    let selected = [...movies];

    if (typeof maxCards === "number" && maxCards > 0) {
      selected =
        randomizeSelection && selected.length > maxCards
          ? pickRandomMovies(selected, maxCards)
          : selected.slice(0, maxCards);
    }

    if (
      typeof fixedCardCount === "number" &&
      fixedCardCount > 0 &&
      selected.length > 0 &&
      selected.length < fixedCardCount
    ) {
      const base = [...selected];

      while (selected.length < fixedCardCount) {
        selected.push(base[selected.length % base.length]);
      }
    }

    return selected;
  }, [fixedCardCount, maxCards, movies, randomizeSelection]);

  const updateRowScrollState = useCallback(() => {
    if (!isRowLayout) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const rail = rowRef.current;
    if (!rail) {
      return;
    }

    const maxLeft = rail.scrollWidth - rail.clientWidth;
    const epsilon = 2;

    setCanScrollLeft(rail.scrollLeft > epsilon);
    setCanScrollRight(maxLeft - rail.scrollLeft > epsilon);
  }, [isRowLayout]);

  useEffect(() => {
    if (!isRowLayout) {
      return;
    }

    const rail = rowRef.current;
    if (!rail) {
      return;
    }

    const rafId = window.requestAnimationFrame(updateRowScrollState);
    const handleScroll = () => updateRowScrollState();
    const handleResize = () => updateRowScrollState();

    rail.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      rail.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [isRowLayout, updateRowScrollState, visibleMovies.length, loading, error]);

  function handleRowNavigation(direction: "left" | "right") {
    const rail = rowRef.current;
    if (!rail) {
      return;
    }

    const step = Math.max(rail.clientWidth * 0.88, 260);
    const offset = direction === "left" ? -step : step;

    rail.scrollBy({
      left: offset,
      behavior: "smooth",
    });
  }

  const rowCardCount =
    typeof fixedCardCount === "number" && fixedCardCount > 0
      ? fixedCardCount
      : typeof maxCards === "number" && maxCards > 0
        ? maxCards
        : 4;
  const loadingCardCount = isRowLayout ? rowCardCount : skeletonCount;
  const posterSizes =
    isRowLayout
      ? "(max-width: 920px) 74vw, (max-width: 1200px) 40vw, 320px"
      : "(max-width: 700px) 100vw, (max-width: 980px) 50vw, 33vw";
  const cardsContainerClass =
    isRowLayout ? styles.cardRow : styles.cardGrid;

  return (
    <section className={styles.wrapper}>
      {showControls ? (
        <div className={styles.controlRow}>
          <label className={styles.controlGroup}>
            <span>Search</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try: thriller, Villeneuve, loneliness"
            />
          </label>

          <label className={styles.controlGroup}>
            <span>Mood lane</span>
            <select
              value={moodFilter}
              onChange={(event) =>
                setMoodFilter(event.target.value as MoodLane | "all")
              }
            >
              <option value="all">All moods</option>
              {moodLanes.map((mood) => (
                <option value={mood} key={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.controlGroup}>
            <span>Ending type</span>
            <select
              value={endingTypeFilter}
              onChange={(event) =>
                setEndingTypeFilter(event.target.value as EndingType | "all")
              }
            >
              <option value="all">All endings</option>
              {endingTypes.map((endingType) => (
                <option value={endingType} key={endingType}>
                  {endingType}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.controlGroup}>
            <span>Max intensity</span>
            <select
              value={maxIntensityFilter}
              onChange={(event) =>
                setMaxIntensityFilter(
                  event.target.value === "all"
                    ? "all"
                    : (Number(event.target.value) as 1 | 2 | 3 | 4 | 5),
                )
              }
            >
              <option value="all">Any intensity</option>
              <option value="1">1 - Calm</option>
              <option value="2">2 - Gentle</option>
              <option value="3">3 - Balanced</option>
              <option value="4">4 - Heavy</option>
              <option value="5">5 - Intense</option>
            </select>
          </label>
        </div>
      ) : null}

      {showStatus ? (
        <p className={error ? styles.statusError : styles.status}>{statusText}</p>
      ) : null}

      {isRowLayout ? (
        <div className={styles.rowRail}>
          {showRowArrows ? (
            <button
              type="button"
              className={styles.rowNavButton}
              onClick={() => handleRowNavigation("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll movies left"
            >
              <span>{"<"}</span>
            </button>
          ) : null}

          <div className={cardsContainerClass} ref={rowRef}>
            {loading &&
              Array.from({ length: loadingCardCount }).map((_, index) => (
                <article className={`${styles.card} ${styles.skeleton}`} key={index}>
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLineShort} />
                  <div className={styles.skeletonBlock} />
                </article>
              ))}

            {!loading &&
              !error &&
              visibleMovies.map((movie, index) => {
                const highlightText = Array.isArray(movie.highlight)
                  ? movie.highlight.find((item) => item.trim().length > 0)
                  : undefined;
                const posterSrc = movie.poster ?? null;

                return (
                  <article className={styles.card} key={`${movie.id}-${index}`}>
                    <Link
                      href={`/movies/${encodeURIComponent(movie.slug)}`}
                      className={styles.cardLink}
                      aria-label={`Open details for ${movie.title}`}
                    >
                      <div className={styles.posterFrame}>
                        {posterSrc ? (
                          <Image
                            className={styles.posterImage}
                            src={posterSrc}
                            alt={`${movie.title} poster`}
                            fill
                            unoptimized
                            sizes={posterSizes}
                          />
                        ) : (
                          <div className={`${styles.posterImage} ${styles.posterFallback}`}>
                            <span>{movie.title.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.cardHeader}>
                        <p className={styles.moodPill}>{movie.moodLane}</p>
                        <p className={styles.year}>{movie.year}</p>
                      </div>

                      <h3>{movie.title}</h3>

                      <p className={styles.meta}>
                        {movie.director} · {movie.runtimeMinutes} min · Intensity {" "}
                        {movie.intensity}/5
                      </p>

                      {highlightText ? (
                        <p className={styles.verdict}>{highlightText}</p>
                      ) : null}

                      <div className={styles.tags}>
                        <span className={styles.aftertaste}>
                          Aftertaste: {movie.aftertaste}
                        </span>
                        <span className={styles.endingType}>
                          Ending: {movie.endingType}
                        </span>
                      </div>
                    </Link>
                  </article>
                );
              })}
          </div>

          {showRowArrows ? (
            <button
              type="button"
              className={styles.rowNavButton}
              onClick={() => handleRowNavigation("right")}
              disabled={!canScrollRight}
              aria-label="Scroll movies right"
            >
              <span>{">"}</span>
            </button>
          ) : null}
        </div>
      ) : (
        <div className={cardsContainerClass}>
          {loading &&
            Array.from({ length: loadingCardCount }).map((_, index) => (
              <article className={`${styles.card} ${styles.skeleton}`} key={index}>
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineShort} />
                <div className={styles.skeletonBlock} />
              </article>
            ))}

          {!loading &&
            !error &&
            visibleMovies.map((movie, index) => {
              const highlightText = Array.isArray(movie.highlight)
                ? movie.highlight.find((item) => item.trim().length > 0)
                : undefined;
              const posterSrc = movie.poster ?? null;

              return (
                <article className={styles.card} key={`${movie.id}-${index}`}>
                  <Link
                    href={`/movies/${encodeURIComponent(movie.slug)}`}
                    className={styles.cardLink}
                    aria-label={`Open details for ${movie.title}`}
                  >
                    <div className={styles.posterFrame}>
                      {posterSrc ? (
                        <Image
                          className={styles.posterImage}
                          src={posterSrc}
                          alt={`${movie.title} poster`}
                          fill
                          unoptimized
                          sizes={posterSizes}
                        />
                      ) : (
                        <div className={`${styles.posterImage} ${styles.posterFallback}`}>
                          <span>{movie.title.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.cardHeader}>
                      <p className={styles.moodPill}>{movie.moodLane}</p>
                      <p className={styles.year}>{movie.year}</p>
                    </div>

                    <h3>{movie.title}</h3>

                    <p className={styles.meta}>
                      {movie.director} · {movie.runtimeMinutes} min · Intensity {" "}
                      {movie.intensity}/5
                    </p>

                    {highlightText ? (
                      <p className={styles.verdict}>{highlightText}</p>
                    ) : null}

                    <div className={styles.tags}>
                      <span className={styles.aftertaste}>
                        Aftertaste: {movie.aftertaste}
                      </span>
                      <span className={styles.endingType}>
                        Ending: {movie.endingType}
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })}
        </div>
      )}
    </section>
  );
}
