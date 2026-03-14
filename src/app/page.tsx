import Link from "next/link";
import styles from "./page.module.css";
import { FeaturedDiscovery } from "@/components/featured-discovery";
import { MoodDiscoverySections } from "@/components/mood-discovery-sections";
import { MovieCards } from "@/components/movie-cards";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />
      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarActions}>
            <Link href="/my-movies" className={styles.toolbarLink}>
              My Movies
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <section className={styles.heroStage}>
          <FeaturedDiscovery />
        </section>

        <section className={styles.moodStage}>
          <MoodDiscoverySections />
        </section>

        <section className={styles.panel}>
          <MovieCards />
        </section>
      </main>
    </div>
  );
}
