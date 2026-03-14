"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import styles from "./trailer-modal.module.css";

type TrailerModalProps = {
  title: string;
  videoId: string;
};

export function TrailerModal({ title, videoId }: TrailerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const thumbnailUrl = useMemo(
    () => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    [videoId],
  );
  const embedUrl = useMemo(
    () =>
      `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
    [videoId],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={styles.thumbnailButton}
        onClick={() => setIsOpen(true)}
        aria-label={`Open trailer for ${title}`}
      >
        <div className={styles.thumbnailMedia}>
          <Image
            src={thumbnailUrl}
            alt={`${title} trailer thumbnail`}
            fill
            unoptimized
            className={styles.thumbnailImage}
            sizes="(max-width: 920px) 92vw, 760px"
          />
        </div>

        <span className={styles.playButton} aria-hidden="true">
          <span className={styles.playGlyph} />
        </span>

        <span className={styles.thumbnailLabel}>Watch Trailer</span>
      </button>

      {isOpen ? (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} trailer player`}
          onClick={() => setIsOpen(false)}
        >
          <div className={styles.modalBody} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close trailer"
            >
              Close
            </button>

            <div className={styles.playerShell}>
              <iframe
                src={embedUrl}
                title={`${title} trailer`}
                loading="eager"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}