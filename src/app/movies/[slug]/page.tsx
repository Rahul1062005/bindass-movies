import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Movie } from "@/lib/movies";
import { MovieTrackingControl } from "@/components/movie-tracking-control";
import { SimilarMoviesCarousel } from "@/components/similar-movies-carousel";
import { TrailerModal } from "@/components/trailer-modal";
import styles from "./page.module.css";

type MovieResponse = {
  movie: Movie;
};

type MoviesResponse = {
  movies: Movie[];
};

const YOUTUBE_VIDEO_ID_REGEX = /"videoId":"([A-Za-z0-9_-]{11})"/g;

async function getBaseUrl(): Promise<string> {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    process.env.VERCEL_URL ??
    "localhost:3000";

  const proto =
    headerStore.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");

  return `${proto}://${host}`;
}

async function fetchMovieBySlug(slug: string, baseUrl: string): Promise<Movie> {
  const response = await fetch(
    `${baseUrl}/api/movies/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Failed to load movie details.");
  }

  const payload = (await response.json()) as MovieResponse;
  return payload.movie;
}

async function fetchSimilarMovies(movie: Movie, baseUrl: string): Promise<Movie[]> {
  const params = new URLSearchParams({
    mood: movie.moodLane,
    limit: "30",
  });

  const response = await fetch(`${baseUrl}/api/movies?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as MoviesResponse;

  return payload.movies
    .filter((candidate) => candidate.slug !== movie.slug)
    .sort((a, b) => {
      const intensityDeltaA = Math.abs(a.intensity - movie.intensity);
      const intensityDeltaB = Math.abs(b.intensity - movie.intensity);

      if (intensityDeltaA !== intensityDeltaB) {
        return intensityDeltaA - intensityDeltaB;
      }

      return b.year - a.year;
    })
    .slice(0, 6);
}

async function fetchYouTubeTrailerId(movie: Movie): Promise<string | null> {
  const query = `${movie.title} ${movie.year} official trailer`;
  const params = new URLSearchParams({ search_query: query });

  try {
    const response = await fetch(`https://www.youtube.com/results?${params.toString()}`, {
      cache: "no-store",
      headers: {
        "accept-language": "en-US,en;q=0.8",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const seenIds = new Set<string>();

    for (const match of html.matchAll(YOUTUBE_VIDEO_ID_REGEX)) {
      const candidateId = match[1];

      if (candidateId && !seenIds.has(candidateId)) {
        seenIds.add(candidateId);
        return candidateId;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const baseUrlPromise = getBaseUrl();
  const moviePromise = baseUrlPromise.then((baseUrl) =>
    fetchMovieBySlug(slug, baseUrl),
  );
  const similarMoviesPromise = Promise.all([moviePromise, baseUrlPromise]).then(
    ([movie, baseUrl]) => fetchSimilarMovies(movie, baseUrl),
  );
  const trailerVideoIdPromise = moviePromise.then((movie) =>
    fetchYouTubeTrailerId(movie),
  );

  const [movie, similarMovies, trailerVideoId] = await Promise.all([
    moviePromise,
    similarMoviesPromise,
    trailerVideoIdPromise,
  ]);
  const heroImageSrc = movie.backdropUrl ?? movie.poster ?? movie.posterUrl;
  const heroEdgeStyle = heroImageSrc
    ? { backgroundImage: `url(${heroImageSrc})` }
    : undefined;
  const highlightText = Array.isArray(movie.highlight)
    ? movie.highlight.find((item) => item.trim().length > 0)
    : undefined;
  const detailLayoutClassName = trailerVideoId
    ? styles.detailSplit
    : `${styles.detailSplit} ${styles.detailSplitSingle}`;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topNav}>
          <Link href="/" className={styles.backLink}>
            Back to catalog
          </Link>
          <Link href="/my-movies" className={styles.backLink}>
            My Movies
          </Link>
        </div>

        <article className={styles.heroBanner}>
          {heroImageSrc ? (
            <Image
              src={heroImageSrc}
              alt={`${movie.title} backdrop`}
              fill
              unoptimized
              className={styles.heroImage}
              sizes="100vw"
              priority
            />
          ) : (
            <div className={`${styles.heroImage} ${styles.heroFallback}`}>
              <span>{movie.title.charAt(0).toUpperCase()}</span>
            </div>
          )}

          {heroImageSrc ? (
            <div className={styles.heroEdgeBlur} style={heroEdgeStyle} aria-hidden="true" />
          ) : null}

          <div className={styles.heroOverlay} aria-hidden="true" />

          <div className={styles.heroContent}>
            <h1>{movie.title}</h1>

            <p className={styles.heroMeta}>
              {movie.year} · {movie.director} · {movie.runtimeMinutes} min · Intensity {" "}
              {movie.intensity}/5
            </p>

            <div className={styles.heroTagRow}>
              <span>{movie.moodLane}</span>
              <span>Aftertaste: {movie.aftertaste}</span>
              <span>Ending: {movie.endingType}</span>
            </div>
          </div>
        </article>

        <div className={detailLayoutClassName}>
          <section className={styles.detailPanel}>
            <h2>Synopsis</h2>
            <p className={styles.synopsis}>{movie.synopsis}</p>

            {highlightText ? (
              <p className={styles.highlight}>{highlightText}</p>
            ) : null}

            {Array.isArray(movie.watchRisk) && movie.watchRisk.length > 0 ? (
              <div className={styles.riskRow}>
                {movie.watchRisk.map((risk) => (
                  <span key={risk}>{risk}</span>
                ))}
              </div>
            ) : null}
          </section>

          {trailerVideoId ? (
            <section className={styles.trailerPanel}>
              <h2>Trailer</h2>
              <TrailerModal title={movie.title} videoId={trailerVideoId} />
            </section>
          ) : null}
        </div>

        <div className={styles.interactionSplit}>
          <MovieTrackingControl
            movie={{
              id: movie.id,
              slug: movie.slug,
              title: movie.title,
              year: movie.year,
              poster:
                movie.poster ?? movie.posterUrl ?? movie.backdropUrl ?? null,
              moodLane: movie.moodLane,
              intensity: movie.intensity,
            }}
          />

          <SimilarMoviesCarousel movies={similarMovies} />
        </div>
      </div>
    </main>
  );
}
