"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Movie } from "@/lib/movies";
import styles from "./featured-discovery.module.css";

type RandomMovieResponse = {
  movie?: Movie;
};

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getRandomMovieUrl(excludeSlug?: string) {
  if (!excludeSlug) {
    return "/api/movies/random";
  }

  const params = new URLSearchParams({ excludeSlug });
  return `/api/movies/random?${params.toString()}`;
}

export function FeaturedDiscovery() {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(getRandomMovieUrl(), {
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Failed to fetch featured movie.");
        }

        const payload = (await response.json()) as RandomMovieResponse;
        setMovie(payload.movie ?? null);
        setPhase("in");
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
  }, []);

  useEffect(() => {
    if (phase !== "in") {
      return;
    }

    const timer = window.setTimeout(() => {
      setPhase("idle");
    }, 520);

    return () => {
      window.clearTimeout(timer);
    };
  }, [phase]);

  async function handleSurpriseMe() {
    if (loading || isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);
      setError(null);
      setPhase("out");
      await wait(180);

      const response = await fetch(getRandomMovieUrl(movie?.slug), {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Could not pick a random movie.");
      }

      const payload = (await response.json()) as RandomMovieResponse;
      setMovie(payload.movie ?? null);
      setPhase("in");
    } catch (err) {
      setPhase("idle");
      setError((err as Error).message);
    } finally {
      setIsRefreshing(false);
    }
  }

  const backdropImageUrl = useMemo(
    () => movie?.backdropUrl ?? movie?.poster ?? movie?.posterUrl ?? null,
    [movie?.backdropUrl, movie?.poster, movie?.posterUrl],
  );

  if (loading) {
    return (
      <section className={styles.wrapper} aria-label="Featured Discovery">
        <article className={`${styles.card} ${styles.loading}`}>
          <div className={styles.loadingLineWide} />
          <div className={styles.loadingLineShort} />
          <div className={styles.loadingBlock} />
        </article>
      </section>
    );
  }

  if (!movie) {
    return (
      <section className={styles.wrapper} aria-label="Featured Discovery">
        <article className={styles.card}>
          <div className={styles.fallbackBackdrop} aria-hidden="true" />
          <div className={styles.content}>
            <div className={styles.topRow}>
              <p className={styles.kicker}>Featured Discovery</p>
              <button
                type="button"
                onClick={handleSurpriseMe}
                className={styles.surpriseButton}
                disabled={isRefreshing}
              >
                {isRefreshing ? "Scanning..." : "Surprise Me"}
              </button>
            </div>
            <h2>No featured movie right now</h2>
            <p className={styles.meta}>
              {error
                ? `Reason: ${error}`
                : "Try refreshing the page to load a new pick."}
            </p>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className={styles.wrapper} aria-label="Featured Discovery">
      <article
        className={`${styles.card} ${
          phase === "out"
            ? styles.phaseOut
            : phase === "in"
              ? styles.phaseIn
              : ""
        }`}
      >
        {backdropImageUrl ? (
          <>
            <div className={styles.backdropMedia} aria-hidden="true">
              <Image
                src={backdropImageUrl}
                alt=""
                fill
                unoptimized
                className={styles.backdropImage}
                sizes="(max-width: 860px) 100vw, 1100px"
              />
            </div>
            <div className={styles.backdropOverlay} aria-hidden="true" />
          </>
        ) : (
          <div className={styles.fallbackBackdrop} aria-hidden="true" />
        )}

        <div className={styles.content}>
          <div className={styles.topRow}>
            <p className={styles.kicker}>Featured Discovery</p>
            <button
              type="button"
              onClick={handleSurpriseMe}
              className={styles.surpriseButton}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Scanning..." : "Surprise Me"}
            </button>
          </div>
          <h2>{movie.title}</h2>
          <p className={styles.meta}>
            {movie.year} · {movie.runtimeMinutes} min · Intensity {movie.intensity}/5
          </p>
          <p className={styles.synopsis}>{movie.synopsis}</p>

          <div className={styles.badgeRow}>
            <span>{movie.moodLane}</span>
            <span>Aftertaste: {movie.aftertaste}</span>
            <span>Ending: {movie.endingType}</span>
          </div>

          {error ? <p className={styles.errorText}>{error}</p> : null}
        </div>
      </article>
    </section>
  );
}