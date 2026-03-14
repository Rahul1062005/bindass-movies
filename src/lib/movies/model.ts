import { model, models, Schema, type Model } from "mongoose";
import {
  aftertasteLabels,
  endingTypes,
  intensityLevels,
  moodLanes,
  watchRiskTags,
  type Movie,
} from "./types";

export type MovieDocument = Movie & {
  createdAt: Date;
  updatedAt: Date;
};

const movieSchema = new Schema<MovieDocument>(
  {
    id: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1888 },
    director: { type: String, required: true, trim: true },
    runtimeMinutes: { type: Number, required: true, min: 1 },
    poster: { type: String, trim: true },
    posterUrl: { type: String, trim: true },
    backdropUrl: { type: String, trim: true },
    moodLane: { type: String, required: true, enum: moodLanes },
    aftertaste: { type: String, required: true, enum: aftertasteLabels },
    intensity: { type: Number, required: true, enum: intensityLevels },
    endingType: { type: String, required: true, enum: endingTypes },
    watchRisk: [
      {
        type: String,
        enum: watchRiskTags,
        required: true,
      },
    ],
    verdict: { type: String, required: true, trim: true },
    synopsis: { type: String, required: true, trim: true },
    highlight: [
      {
        type: String,
        required: true,
      },
    ],
  },
  {
    collection: "movies",
    timestamps: true,
    versionKey: false,
  },
);

movieSchema.index({ id: 1 }, { unique: true });
movieSchema.index({ slug: 1 }, { unique: true });
movieSchema.index({ year: -1, title: 1 });

export const MovieModel: Model<MovieDocument> =
  (models.Movie as Model<MovieDocument> | undefined) ??
  model<MovieDocument>("Movie", movieSchema);
