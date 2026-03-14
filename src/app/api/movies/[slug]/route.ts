import { NextResponse } from "next/server";
import { findMovieBySlugFromStore } from "@/lib/movies/repository";

type Params = {
  slug: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<Params> },
) {
  const { slug } = await context.params;
  const movie = await findMovieBySlugFromStore(slug);

  if (!movie) {
    return NextResponse.json(
      { error: `Movie not found for slug: ${slug}` },
      { status: 404 },
    );
  }

  return NextResponse.json({ movie });
}
