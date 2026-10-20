import "server-only";

import mongoose, { type Mongoose } from "mongoose";

type MongooseCache = {
  connection: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached = (globalThis.mongooseCache ??= {
  connection: null,
  promise: null,
});

export async function connectToDatabase(): Promise<Mongoose> {
  const uri = process.env.MONGODB_URL?.trim();
  const dbName = process.env.MONGODB_DB?.trim();

  if (!uri || !dbName) {
    const missingVariables = [
      !uri && "MONGODB_URL",
      !dbName && "MONGODB_DB",
    ].filter(Boolean);
    throw new Error(
      `Missing required MongoDB environment variable(s): ${missingVariables.join(", ")}`,
    );
  }

  if (cached.connection) {
    return cached.connection;
  }

  cached.promise ??= mongoose.connect(uri, { dbName });

  try {
    cached.connection = await cached.promise;
    return cached.connection;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
