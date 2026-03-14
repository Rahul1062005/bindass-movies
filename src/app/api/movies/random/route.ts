import { NextRequest, NextResponse } from "next/server";
import { queryMoviesFromStore, randomMovieFromStore } from "@/lib/movies/repository";
import type { Movie } from "@/lib/movies";

type ErrorResponse = {
  error: string;
};

function hasVisualMedia(movie: Movie): boolean {
  const image = movie.backdropUrl ?? movie.poster ?? movie.posterUrl;
  return Boolean(image && image.trim().length > 0);
}

function pickRandomMovie(candidates: Movie[]): Movie | null {
  if (candidates.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index] ?? null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const excludeSlug = searchParams.get("excludeSlug") ?? undefined;

  const catalog = await queryMoviesFromStore({ limit: 30 });
  const filtered = catalog.filter((candidate) =>
    excludeSlug ? candidate.slug !== excludeSlug : true,
  );

  // Prefer movies with artwork so the Featured Discovery hero can render a backdrop.
  const visualCandidates = filtered.filter(hasVisualMedia);
  const preferredPool = visualCandidates.length > 0 ? visualCandidates : filtered;

  let movie = pickRandomMovie(preferredPool);

  if (!movie) {
    movie = await randomMovieFromStore({ excludeSlug });
  }

  if (!movie) {
    return NextResponse.json<ErrorResponse>(
      { error: "No movie available for random discovery." },
      { status: 404 },
    );
  }

  return NextResponse.json({ movie });
}
