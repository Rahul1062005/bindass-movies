import styles from "./loading.module.css";

const similarSkeletonCount = 3;

export default function MovieDetailLoading() {
  return (
    <main className={styles.page} aria-busy="true" aria-live="polite">
      <div className={styles.container}>
        <div className={`${styles.backPill} ${styles.skeleton}`} aria-hidden="true" />

        <section className={styles.heroBanner} aria-label="Loading movie hero">
          <div className={`${styles.heroBackdrop} ${styles.skeleton}`} aria-hidden="true" />
          <div className={styles.heroOverlay} aria-hidden="true" />

          <div className={styles.heroContent}>
            <div className={`${styles.titleLine} ${styles.skeleton}`} aria-hidden="true" />
            <div className={`${styles.metaLine} ${styles.skeleton}`} aria-hidden="true" />
            <div className={styles.pillRow} aria-hidden="true">
              <span className={`${styles.pill} ${styles.skeleton}`} />
              <span className={`${styles.pill} ${styles.skeleton}`} />
              <span className={`${styles.pill} ${styles.skeleton}`} />
            </div>
          </div>
        </section>

        <div className={styles.detailSplit}>
          <section className={`${styles.panel} ${styles.synopsisPanel}`} aria-label="Loading synopsis">
            <div className={`${styles.sectionHeading} ${styles.skeleton}`} aria-hidden="true" />
            <div className={`${styles.textLine} ${styles.skeleton}`} aria-hidden="true" />
            <div className={`${styles.textLine} ${styles.skeleton}`} aria-hidden="true" />
            <div className={`${styles.textLine} ${styles.skeleton}`} aria-hidden="true" />
            <div className={`${styles.textLineShort} ${styles.skeleton}`} aria-hidden="true" />
          </section>

          <section className={`${styles.panel} ${styles.trailerPanel}`} aria-label="Loading trailer thumbnail">
            <div className={`${styles.sectionHeading} ${styles.skeleton}`} aria-hidden="true" />
            <div className={`${styles.trailerThumb} ${styles.skeleton}`} aria-hidden="true">
              <span className={styles.playButton} />
            </div>
          </section>
        </div>

        <section className={`${styles.panel} ${styles.similarPanel}`} aria-label="Loading similar movies">
          <div className={`${styles.sectionHeading} ${styles.skeleton}`} aria-hidden="true" />

          <div className={styles.similarRow}>
            {Array.from({ length: similarSkeletonCount }).map((_, index) => (
              <article className={styles.similarCard} key={index}>
                <div className={`${styles.similarPoster} ${styles.skeleton}`} aria-hidden="true" />
                <div className={`${styles.cardLine} ${styles.skeleton}`} aria-hidden="true" />
                <div className={`${styles.cardLineShort} ${styles.skeleton}`} aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
