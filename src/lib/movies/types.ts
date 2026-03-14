export const moodLanes = [
  "🧠 Mind-Bending",
  "🌒 Dark Stories",
  "😰 Edge-of-Seat",
  "💖 Emotional",
  "🏔️ Big Epic",
  "🔥 Slow Burn",
  "☀️ Feel Good",
  "🤔 Thoughtful",
] as const;

export const aftertasteLabels = [
  "Hopeful",
  "Reflective",
  "Unsettled",
  "Euphoric",
  "Devastated",
  "Bittersweet",
] as const;

export const endingTypes = [
  "Resolved",
  "Open-ended",
  "Ambiguous",
  "Twist-driven",
  "Existential",
] as const;

export const watchRiskTags = [
  "Slow burn",
  "Emotional heavy",
  "Graphic violence",
  "Psychological tension",
  "Complex timeline",
  "Bleak themes",
] as const;

export const intensityLevels = [1, 2, 3, 4, 5] as const;

export type MoodLane = (typeof moodLanes)[number];
export type Aftertaste = (typeof aftertasteLabels)[number];
export type EndingType = (typeof endingTypes)[number];
export type WatchRiskTag = (typeof watchRiskTags)[number];
export type IntensityLevel = (typeof intensityLevels)[number];

export type Movie = {
  id: string;
  slug: string;
  title: string;
  year: number;
  director: string;
  runtimeMinutes: number;
  poster?: string | null;
  posterUrl?: string;
  backdropUrl?: string;
  moodLane: MoodLane;
  aftertaste: Aftertaste;
  intensity: IntensityLevel;
  endingType: EndingType;
  watchRisk: WatchRiskTag[];
  verdict: string;
  synopsis: string;
  highlight: string[];
};

export type MovieQuery = {
  mood?: MoodLane;
  endingType?: EndingType;
  search?: string;
  maxIntensity?: IntensityLevel;
  limit?: number;
};

const moodLaneSet = new Set<string>(moodLanes);
const endingTypeSet = new Set<string>(endingTypes);
const intensitySet = new Set<number>(intensityLevels);

export function isMoodLane(value: string): value is MoodLane {
  return moodLaneSet.has(value);
}

export function isEndingType(value: string): value is EndingType {
  return endingTypeSet.has(value);
}

export function isIntensityLevel(value: number): value is IntensityLevel {
  return intensitySet.has(value);
}
