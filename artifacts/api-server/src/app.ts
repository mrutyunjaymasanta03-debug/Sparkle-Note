import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { connectMongoDB } from "@workspace/mongodb";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

connectMongoDB()
  .then(() => {
    logger.info("Connected to MongoDB");
    return seedNotesIfEmpty();
  })
  .catch((err: unknown) => {
    logger.error({ err }, "Failed to connect to MongoDB");
  });

async function seedNotesIfEmpty() {
  const { getDb } = await import("@workspace/mongodb");
  const db = await getDb();
  const col = db.collection("notes");

  const count = await col.countDocuments();
  if (count > 0) return;

  const now = new Date();
  await col.insertMany([
    {
      title: "Welcome to Sparkle Note Hub",
      content:
        "This is your personal note-taking space. Create, organize, and search your notes with ease. Use tags to categorize them and pin the most important ones!",
      color: "#fef3c7",
      tags: ["welcome", "getting-started"],
      pinned: true,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Shopping List",
      content:
        "- Milk\n- Eggs\n- Bread\n- Coffee\n- Fresh vegetables\n- Olive oil",
      color: "#d1fae5",
      tags: ["personal", "shopping"],
      pinned: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Project Ideas",
      content:
        "1. Build a habit tracker with streaks\n2. Create a recipe manager with ingredient search\n3. Design a minimalist time-blocking app\n4. Experiment with generative art using canvas",
      color: "#ede9fe",
      tags: ["ideas", "projects", "tech"],
      pinned: true,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    },
    {
      title: "Book Notes: Atomic Habits",
      content:
        "Key insight: Small habits compound over time. Focus on systems, not goals. Make good habits obvious, attractive, easy, and satisfying. Identity-based habits are the most powerful.",
      color: "#fce7f3",
      tags: ["books", "learning", "productivity"],
      pinned: false,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Meeting Notes — Q2 Planning",
      content:
        "Action items:\n- Review roadmap by Friday\n- Share updated budget estimates\n- Schedule 1:1s with team leads\n- Draft OKRs for next quarter",
      color: "#dbeafe",
      tags: ["work", "meetings"],
      pinned: false,
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  ]);

  logger.info("Seeded initial notes");
}

export default app;
