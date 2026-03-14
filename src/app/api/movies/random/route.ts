import { NextRequest, NextResponse } from "next/server";
import { randomMovieFromStore } from "@/lib/movies/repository";

type ErrorResponse = {
  error: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const excludeSlug = searchParams.get("excludeSlug") ?? undefined;

  const movie = await randomMovieFromStore({ excludeSlug });

  if (!movie) {
    return NextResponse.json<ErrorResponse>(
      { error: "No movie available for random discovery." },
      { status: 404 },
    );
  }

  return NextResponse.json({ movie });
}
