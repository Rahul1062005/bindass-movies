"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearMovieTrackingStatus,
  getMovieRatingBySlug,
  getTrackedMovieBySlug,
  getTrackingStatusLabel,
  movieRatingValues,
  setMovieRating,
  setMovieTrackingStatus,
  subscribeToTrackingUpdates,
  type MovieRating,
  trackingStatuses,
  type TrackingStatusKey,
  type TrackedMovieInput,
} from "@/lib/movies/tracking";
import styles from "./movie-tracking-control.module.css";

type MovieTrackingControlProps = {
  movie: TrackedMovieInput;
};

const UNTRACKED_VALUE = "untracked";
type SelectValue = TrackingStatusKey | typeof UNTRACKED_VALUE;

export function MovieTrackingControl({ movie }: MovieTrackingControlProps) {
  const [statusValue, setStatusValue] = useState<SelectValue>(UNTRACKED_VALUE);
  const [ratingValue, setRatingValue] = useState<MovieRating | 0>(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const trackedMovie = getTrackedMovieBySlug(movie.slug);
      const rating = getMovieRatingBySlug(movie.slug);
      setStatusValue(trackedMovie?.status ?? UNTRACKED_VALUE);
      setRatingValue(rating ?? 0);
      setIsReady(true);
    };

    sync();

    return subscribeToTrackingUpdates(sync);
  }, [movie.slug]);

  const helperText = useMemo(() => {
    if (!isReady) {
      return "Loading your tracker...";
    }

    if (statusValue === UNTRACKED_VALUE) {
      return "This movie is not tracked yet.";
    }

    return `Current status: ${getTrackingStatusLabel(statusValue)}.`;
  }, [isReady, statusValue]);

  function handleStatusChange(value: SelectValue) {
    setStatusValue(value);

    if (value === UNTRACKED_VALUE) {
      clearMovieTrackingStatus(movie.slug);
      return;
    }

    setMovieTrackingStatus(movie, value);
  }

  function handleRatingSelect(value: MovieRating) {
    setRatingValue(value);
    setMovieRating(movie, value);
  }

  function handleClearRating() {
    setRatingValue(0);
    setMovieRating(movie, null);
  }

  return (
    <section className={styles.panel} aria-live="polite">
      <div className={styles.header}>
        <h3>Watch Tracking</h3>
        <p>Save this movie under a watch status.</p>
      </div>

      <label className={styles.field}>
        <span>Status</span>
        <select
          value={statusValue}
          onChange={(event) => handleStatusChange(event.target.value as SelectValue)}
          disabled={!isReady}
        >
          <option value={UNTRACKED_VALUE}>Not tracked</option>
          {trackingStatuses.map((status) => (
            <option key={status.key} value={status.key}>
              {status.label}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.ratingSection}>
        <span className={styles.ratingLabel}>Your rating</span>

        <div
          className={styles.starRow}
          role="radiogroup"
          aria-label="Rate this movie from 1 to 5 stars"
        >
          {movieRatingValues.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={ratingValue === value}
              aria-label={`Rate ${value} out of 5`}
              className={`${styles.starButton} ${
                ratingValue >= value ? styles.starButtonActive : ""
              }`}
              onClick={() => handleRatingSelect(value)}
              disabled={!isReady}
            >
              {"\u2605"}
            </button>
          ))}
        </div>

        <div className={styles.ratingMetaRow}>
          <p className={styles.ratingMeta}>
            {ratingValue > 0
              ? `Your rating: ${ratingValue}/5`
              : "No rating yet."}
          </p>

          {ratingValue > 0 ? (
            <button
              type="button"
              className={styles.ratingClear}
              onClick={handleClearRating}
              disabled={!isReady}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <p className={styles.current}>{helperText}</p>
    </section>
  );
}