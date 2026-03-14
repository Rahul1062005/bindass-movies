"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type WheelEvent } from "react";
import type { Movie } from "@/lib/movies";
import styles from "./similar-movies-carousel.module.css";

type SimilarMoviesCarouselProps = {
  movies: Movie[];
};

export function SimilarMoviesCarousel({ movies }: SimilarMoviesCarouselProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;
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
    const rail = railRef.current;
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
    const rail = railRef.current;
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
  }, [movies.length, updateScrollState]);

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    const rail = railRef.current;
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

  function handleArrowClick(direction: "left" | "right") {
    const rail = railRef.current;
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

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Similar Movies</h2>
        <p>Picked by same mood lane and closest intensity.</p>
      </div>

      {movies.length === 0 ? (
        <p className={styles.emptyState}>No similar movies found yet.</p>
      ) : (
        <div className={styles.carouselShell}>
          {canScrollLeft ? (
            <button
              type="button"
              className={styles.navButton}
              onClick={() => handleArrowClick("left")}
              aria-label="Scroll similar movies left"
            >
              <span>{"<"}</span>
            </button>
          ) : (
            <span className={styles.navSpacer} aria-hidden="true" />
          )}

          <div className={styles.rail} ref={railRef} onWheel={handleWheel}>
            {movies.map((movie) => {
              const posterSrc = movie.poster ?? movie.posterUrl ?? movie.backdropUrl ?? null;

              return (
                <Link
                  href={`/movies/${encodeURIComponent(movie.slug)}`}
                  key={movie.id}
                  className={styles.card}
                >
                  <div className={styles.posterFrame}>
                    {posterSrc ? (
                      <Image
                        src={posterSrc}
                        alt={`${movie.title} poster`}
                        fill
                        unoptimized
                        className={styles.posterImage}
                        sizes="(max-width: 920px) 78vw, 260px"
                      />
                    ) : (
                      <div className={`${styles.posterImage} ${styles.posterFallback}`}>
                        <span>{movie.title.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>

                  <h3>{movie.title}</h3>
                  <p className={styles.meta}>
                    {movie.year} · Intensity {movie.intensity}/5
                  </p>
                  <p className={styles.mood}>{movie.moodLane}</p>
                </Link>
              );
            })}
          </div>

          {canScrollRight ? (
            <button
              type="button"
              className={styles.navButton}
              onClick={() => handleArrowClick("right")}
              aria-label="Scroll similar movies right"
            >
              <span>{">"}</span>
            </button>
          ) : (
            <span className={styles.navSpacer} aria-hidden="true" />
          )}
        </div>
      )}
    </section>
  );
}