import { MongoClient, type Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.MONGODB_DB_NAME ?? "sparkle_note_hub";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongoDB(): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);

  process.on("SIGTERM", async () => {
    await closeMongoDB();
  });

  process.on("SIGINT", async () => {
    await closeMongoDB();
    process.exit(0);
  });

  return db;
}

export async function getDb(): Promise<Db> {
  if (!db) {
    return connectMongoDB();
  }
  return db;
}

export async function closeMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export { type Db };
