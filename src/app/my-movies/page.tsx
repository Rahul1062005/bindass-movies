"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import {
  getRecentMovieActivity,
  getTrackingStatistics,
  getTrackedMovies,
  subscribeToTrackingUpdates,
  trackingStatuses,
  type MovieActivityEvent,
  type TrackedMovie,
  type TrackingStatusKey,
  type ViewingStatistics,
} from "@/lib/movies/tracking";
import styles from "./page.module.css";

type GroupedTrackedMovies = Record<TrackingStatusKey, TrackedMovie[]>;

type StatisticCard = {
  title: string;
  value: string;
};

type MovieStatusRowProps = {
  movies: TrackedMovie[];
  statusLabel: string;
  emptyStateText: string;
  isHydrated: boolean;
};

const relativeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

const emptyStateByStatus: Record<TrackingStatusKey, string> = {
  planToWatch: "Nothing planned yet. Mark movies to build your queue.",
  watching: "No active watches right now.",
  watched: "No completed movies yet.",
  favorite: "No favorites yet. Promote your top picks from movie pages.",
};

function createEmptyGroups(): GroupedTrackedMovies {
  return {
    planToWatch: [],
    watching: [],
    watched: [],
    favorite: [],
  };
}

function groupMoviesByStatus(movies: TrackedMovie[]): GroupedTrackedMovies {
  const grouped = createEmptyGroups();

  for (const movie of movies) {
    grouped[movie.status].push(movie);
  }

  return grouped;
}

function formatRelativeTime(time: string): string {
  const parsed = Date.parse(time);

  if (!Number.isFinite(parsed)) {
    return "just now";
  }

  const diffSeconds = Math.round((parsed - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 45) {
    return "just now";
  }

  if (absSeconds < 2700) {
    return relativeFormatter.format(Math.round(diffSeconds / 60), "minute");
  }

  if (absSeconds < 64800) {
    return relativeFormatter.format(Math.round(diffSeconds / 3600), "hour");
  }

  if (absSeconds < 561600) {
    return relativeFormatter.format(Math.round(diffSeconds / 86400), "day");
  }

  if (absSeconds < 2419200) {
    return relativeFormatter.format(Math.round(diffSeconds / 604800), "week");
  }

  if (absSeconds < 29030400) {
    return relativeFormatter.format(Math.round(diffSeconds / 2592000), "month");
  }

  return relativeFormatter.format(Math.round(diffSeconds / 31536000), "year");
}

function createEmptyStatistics(): ViewingStatistics {
  return {
    totalTracked: 0,
    totalWatched: 0,
    totalPlanToWatch: 0,
    totalWatching: 0,
    totalFavorite: 0,
    averageWatchedIntensity: null,
    mostCommonWatchedMoodLane: null,
  };
}

function MovieStatusRow({
  movies,
  statusLabel,
  emptyStateText,
  isHydrated,
}: MovieStatusRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const rail = rowRef.current;
    if (!rail) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const maxLeft = rail.scrollWidth - rail.clientWidth;
    const epsilon = 2;

    setCanScrollLeft(rail.scrollLeft > epsilon);
    setCanScrollRight(maxLeft - rail.scrollLeft > epsilon);
  }, []);

  const getScrollStep = useCallback(() => {
    const rail = rowRef.current;
    if (!rail) {
      return 260;
    }

    const firstCard = rail.firstElementChild as HTMLElement | null;
    if (!firstCard) {
      return 260;
    }

    const railStyle = window.getComputedStyle(rail);
    const gapRaw = railStyle.columnGap || railStyle.gap || "0";
    const gap = Number.parseFloat(gapRaw);

    return firstCard.getBoundingClientRect().width + (Number.isFinite(gap) ? gap : 0);
  }, []);

  useEffect(() => {
    if (!isHydrated || movies.length === 0) {
      return;
    }

    const rail = rowRef.current;
    if (!rail) {
      return;
    }

    const rafId = window.requestAnimationFrame(updateScrollState);
    const handleScroll = () => updateScrollState();
    const handleResize = () => updateScrollState();

    rail.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      rail.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [isHydrated, movies.length, updateScrollState]);

  function handleRowNavigation(direction: "left" | "right") {
    const rail = rowRef.current;
    if (!rail) {
      return;
    }

    const step = getScrollStep();
    const left = direction === "left" ? -step : step;

    rail.scrollBy({
      left,
      behavior: "smooth",
    });
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    const rail = rowRef.current;
    if (!rail) {
      return;
    }

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    rail.scrollBy({
      left: event.deltaY,
      behavior: "auto",
    });

    event.preventDefault();
  }

  if (!isHydrated) {
    return <p className={styles.emptyState}>Loading tracked movies...</p>;
  }

  if (movies.length === 0) {
    return <p className={styles.emptyState}>{emptyStateText}</p>;
  }

  return (
    <div className={styles.movieRowShell}>
      {canScrollLeft ? (
        <button
          type="button"
          className={styles.rowNavButton}
          onClick={() => handleRowNavigation("left")}
          aria-label={`Scroll ${statusLabel} movies left`}
        >
          <span>{"<"}</span>
        </button>
      ) : (
        <span className={styles.rowNavSpacer} aria-hidden="true" />
      )}

      <div className={styles.movieRow} ref={rowRef} onWheel={handleWheel}>
        {movies.map((movie) => (
          <article className={styles.card} key={movie.slug}>
            <Link
              href={`/movies/${encodeURIComponent(movie.slug)}`}
              className={styles.cardLink}
            >
              <div className={styles.posterFrame}>
                {movie.poster ? (
                  <Image
                    src={movie.poster}
                    alt={`${movie.title} poster`}
                    fill
                    unoptimized
                    className={styles.posterImage}
                    sizes="(max-width: 920px) 76vw, 260px"
                  />
                ) : (
                  <div className={`${styles.posterImage} ${styles.posterFallback}`}>
                    <span>{movie.title.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className={styles.cardBody}>
                <p className={styles.statusPill}>{statusLabel}</p>
                <h3>{movie.title}</h3>
                <p className={styles.meta}>
                  {movie.year} · Updated {new Date(movie.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {canScrollRight ? (
        <button
          type="button"
          className={styles.rowNavButton}
          onClick={() => handleRowNavigation("right")}
          aria-label={`Scroll ${statusLabel} movies right`}
        >
          <span>{">"}</span>
        </button>
      ) : (
        <span className={styles.rowNavSpacer} aria-hidden="true" />
      )}
    </div>
  );
}

export default function MyMoviesPage() {
  const [trackedMovies, setTrackedMovies] = useState<TrackedMovie[]>([]);
  const [recentActivity, setRecentActivity] = useState<MovieActivityEvent[]>([]);
  const [statistics, setStatistics] = useState<ViewingStatistics>(
    createEmptyStatistics(),
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const sync = () => {
      setTrackedMovies(getTrackedMovies());
      setRecentActivity(getRecentMovieActivity(10));
      setStatistics(getTrackingStatistics());
      setIsHydrated(true);
    };

    sync();
    return subscribeToTrackingUpdates(sync);
  }, []);

  const groupedMovies = useMemo(
    () => groupMoviesByStatus(trackedMovies),
    [trackedMovies],
  );
  const statisticCards = useMemo<StatisticCard[]>(() => {
    return [
      {
        title: "Total Movies Tracked",
        value: String(statistics.totalTracked),
      },
      {
        title: "Movies Watched",
        value: String(statistics.totalWatched),
      },
      {
        title: "Plan to Watch",
        value: String(statistics.totalPlanToWatch),
      },
      {
        title: "Currently Watching",
        value: String(statistics.totalWatching),
      },
      {
        title: "Favorite Movies",
        value: String(statistics.totalFavorite),
      },
      {
        title: "Avg Watched Intensity",
        value: statistics.averageWatchedIntensity === null
          ? "N/A"
          : `${statistics.averageWatchedIntensity.toFixed(1)}/5`,
      },
      {
        title: "Top Watched Mood",
        value: statistics.mostCommonWatchedMoodLane ?? "N/A",
      },
    ];
  }, [statistics]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <Link href="/" className={styles.navPill}>
            Back to catalog
          </Link>
          <p className={styles.totalCount}>{trackedMovies.length} tracked</p>
        </div>

        <section className={styles.hero}>
          <p className={styles.kicker}>My Movies</p>
          <h1>Your watch journey</h1>
          <p>
            Track what you plan to watch, what you are currently watching, what
            you have finished, and your all-time favorites.
          </p>
        </section>

        <div className={styles.infoRow}>
        <section className={styles.statsPanel} aria-label="Viewing statistics">
          <header className={styles.statsHeader}>
            <h2>Viewing Statistics</h2>
          </header>

          <div className={styles.statsGrid}>
            {statisticCards.map((stat) => (
              <article className={styles.statCard} key={stat.title}>
                <p className={styles.statTitle}>{stat.title}</p>
                <p className={styles.statValue}>{stat.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className={styles.activityPanel}
          aria-label="Recent activity timeline"
        >
          <header className={styles.activityHeader}>
            <h2>Recent Activity</h2>
            <span>{recentActivity.length}</span>
          </header>

          {!isHydrated ? (
            <p className={styles.emptyState}>Loading activity timeline...</p>
          ) : recentActivity.length === 0 ? (
            <p className={styles.emptyState}>No recent status changes yet.</p>
          ) : (
            <ol className={styles.activityList}>
              {recentActivity.map((activity, index) => (
                <li
                  className={styles.activityItem}
                  key={`${activity.movieId}-${activity.time}-${index}`}
                >
                  <span className={styles.activityDot} aria-hidden="true" />

                  <div className={styles.activityBody}>
                    <p className={styles.activityTitle}>{activity.title}</p>
                    <p className={styles.activityAction}>{activity.action}</p>
                    <time className={styles.activityTime} dateTime={activity.time}>
                      {formatRelativeTime(activity.time)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
        </div>

        <div className={styles.sectionsGrid}>
          {trackingStatuses.map((status) => {
            const movies = groupedMovies[status.key];

            return (
              <section
                key={status.key}
                className={styles.groupPanel}
                aria-label={`${status.label} movies`}
              >
                <header className={styles.groupHeader}>
                  <h2>{status.label}</h2>
                  <span>{movies.length}</span>
                </header>

                <MovieStatusRow
                  movies={movies}
                  statusLabel={status.label}
                  emptyStateText={emptyStateByStatus[status.key]}
                  isHydrated={isHydrated}
                />
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}