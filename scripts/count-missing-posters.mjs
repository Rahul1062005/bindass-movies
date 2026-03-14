import mongoose from "mongoose";

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  const mongoDb = process.env.MONGODB_DB || "bindass_movies";

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing.");
  }

  await mongoose.connect(mongoUri, {
    dbName: mongoDb,
    bufferCommands: false,
  });

  const collection = mongoose.connection.db.collection("movies");
  const remaining = await collection.countDocuments({
    $or: [{ poster: null }, { poster: { $exists: false } }, { poster: "" }],
  });

  console.log("[poster-null-remaining]", remaining);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("[count-missing-posters] Fatal error:", error);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  process.exitCode = 1;
});
