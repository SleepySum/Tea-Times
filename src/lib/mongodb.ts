import { MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI. Add it to your local and Vercel environment variables.');
  }

  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }

  return global._mongoClientPromise;
}
