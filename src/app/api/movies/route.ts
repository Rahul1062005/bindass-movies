import { NextRequest, NextResponse } from "next/server";
import {
  endingTypes,
  isEndingType,
  isIntensityLevel,
  isMoodLane,
  moodLanes,
  type EndingType,
  type IntensityLevel,
  type MoodLane,
} from "@/lib/movies";
import { queryMoviesFromStore } from "@/lib/movies/repository";

const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 30;

type ErrorResponse = {
  error: string;
  details?: string;
};

function badRequest(error: string, details?: string) {
  return NextResponse.json<ErrorResponse>({ error, details }, { status: 400 });
}

function parseOptionalInteger(value: string | null): number | undefined {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const moodParam = searchParams.get("mood");
  const endingTypeParam = searchParams.get("endingType");
  const search = searchParams.get("search") ?? undefined;

  const limitParam = parseOptionalInteger(searchParams.get("limit"));
  const maxIntensityParam = parseOptionalInteger(searchParams.get("maxIntensity"));

  let mood: MoodLane | undefined;
  let endingType: EndingType | undefined;
  let maxIntensity: IntensityLevel | undefined;

  if (moodParam) {
    if (!isMoodLane(moodParam)) {
      return badRequest(
        "Invalid mood filter.",
        `Allowed values: ${moodLanes.join(", ")}`,
      );
    }

    mood = moodParam;
  }

  if (endingTypeParam) {
    if (!isEndingType(endingTypeParam)) {
      return badRequest(
        "Invalid endingType filter.",
        `Allowed values: ${endingTypes.join(", ")}`,
      );
    }

    endingType = endingTypeParam;
  }

  if (limitParam !== undefined) {
    if (!Number.isInteger(limitParam) || limitParam < 1) {
      return badRequest("Invalid limit.", "limit must be a positive integer.");
    }
  }

  if (maxIntensityParam !== undefined) {
    if (!isIntensityLevel(maxIntensityParam)) {
      return badRequest(
        "Invalid maxIntensity.",
        "maxIntensity must be one of: 1, 2, 3, 4, 5.",
      );
    }

    maxIntensity = maxIntensityParam;
  }

  const movies = await queryMoviesFromStore({
    mood,
    endingType,
    maxIntensity,
    search,
    limit: Math.min(limitParam ?? DEFAULT_LIMIT, MAX_LIMIT),
  });

  return NextResponse.json({
    count: movies.length,
    filters: {
      mood: mood ?? null,
      endingType: endingType ?? null,
      maxIntensity: maxIntensity ?? null,
      search: search ?? null,
      limit: Math.min(limitParam ?? DEFAULT_LIMIT, MAX_LIMIT),
    },
    movies,
  });
}
