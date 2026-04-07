import { Router, type IRouter } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "@workspace/mongodb";
import {
  CreateNoteBody,
  UpdateNoteBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const COLLECTION = "notes";

interface NoteDoc {
  _id?: ObjectId;
  title: string;
  content: string;
  color: string;
  tags: string[];
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toNote(doc: NoteDoc & { _id: ObjectId }) {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    content: doc.content,
    color: doc.color,
    tags: doc.tags,
    pinned: doc.pinned,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

router.get("/notes/stats", async (req, res) => {
  try {
    const db = await getDb();
    const col = db.collection<NoteDoc>(COLLECTION);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, pinned, withTags, recentCount] = await Promise.all([
      col.countDocuments(),
      col.countDocuments({ pinned: true }),
      col.countDocuments({ tags: { $exists: true, $not: { $size: 0 } } }),
      col.countDocuments({ updatedAt: { $gte: sevenDaysAgo } }),
    ]);

    res.json({ total, pinned, withTags, recentCount });
  } catch (err) {
    req.log.error({ err }, "Failed to get note stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/notes/tags", async (req, res) => {
  try {
    const db = await getDb();
    const col = db.collection<NoteDoc>(COLLECTION);

    const pipeline = [
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ];

    const result = await col.aggregate(pipeline).toArray();
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get tags");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/notes/recent", async (req, res) => {
  try {
    const db = await getDb();
    const col = db.collection<NoteDoc>(COLLECTION);

    const docs = await col
      .find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();

    res.json(docs.map((d) => toNote(d as NoteDoc & { _id: ObjectId })));
  } catch (err) {
    req.log.error({ err }, "Failed to get recent notes");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/notes", async (req, res) => {
  try {
    const db = await getDb();
    const col = db.collection<NoteDoc>(COLLECTION);

    const filter: Record<string, unknown> = {};

    const search = req.query["search"];
    if (typeof search === "string" && search.trim()) {
      filter["$or"] = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const tag = req.query["tag"];
    if (typeof tag === "string" && tag.trim()) {
      filter["tags"] = tag;
    }

    const pinnedParam = req.query["pinned"];
    if (pinnedParam === "true") {
      filter["pinned"] = true;
    }

    const docs = await col.find(filter).sort({ updatedAt: -1 }).toArray();
    res.json(docs.map((d) => toNote(d as NoteDoc & { _id: ObjectId })));
  } catch (err) {
    req.log.error({ err }, "Failed to list notes");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notes", async (req, res) => {
  try {
    const parsed = CreateNoteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const db = await getDb();
    const col = db.collection<NoteDoc>(COLLECTION);

    const now = new Date();
    const doc: NoteDoc = {
      title: parsed.data.title,
      content: parsed.data.content,
      color: parsed.data.color ?? "#fef3c7",
      tags: parsed.data.tags ?? [],
      pinned: parsed.data.pinned ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);
    res.status(201).json(toNote({ ...doc, _id: result.insertedId }));
  } catch (err) {
    req.log.error({ err }, "Failed to create note");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const db = await getDb();
    const col = db.collection<NoteDoc>(COLLECTION);
    const doc = await col.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    res.json(toNote(doc as NoteDoc & { _id: ObjectId }));
  } catch (err) {
    req.log.error({ err }, "Failed to get note");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const parsed = UpdateNoteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const db = await getDb();
    const col = db.collection<NoteDoc>(COLLECTION);

    const updates: Partial<NoteDoc> = { updatedAt: new Date() };
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.content !== undefined) updates.content = parsed.data.content;
    if (parsed.data.color !== undefined) updates.color = parsed.data.color;
    if (parsed.data.tags !== undefined) updates.tags = parsed.data.tags;
    if (parsed.data.pinned !== undefined) updates.pinned = parsed.data.pinned;

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    res.json(toNote(result as NoteDoc & { _id: ObjectId }));
  } catch (err) {
    req.log.error({ err }, "Failed to update note");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const db = await getDb();
    const col = db.collection<NoteDoc>(COLLECTION);
    await col.deleteOne({ _id: new ObjectId(id) });
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete note");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/notes/:id/pin", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const db = await getDb();
    const col = db.collection<NoteDoc>(COLLECTION);

    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { pinned: !existing.pinned, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    res.json(toNote(result as NoteDoc & { _id: ObjectId }));
  } catch (err) {
    req.log.error({ err }, "Failed to toggle pin");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
