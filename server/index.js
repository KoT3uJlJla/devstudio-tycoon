import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI не указан в .env");
  process.exit(1);
}

const client = new MongoClient(mongoUri);
let db;

async function start() {
  await client.connect();
  db = client.db("devstudio_tycoon");

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/save/:telegramId", async (req, res) => {
    const { telegramId } = req.params;

    const save = await db.collection("saves").findOne({ telegramId });

    res.json({
      ok: true,
      save: save?.data ?? null
    });
  });

  app.post("/api/save/:telegramId", async (req, res) => {
    const { telegramId } = req.params;
    const data = req.body;

    await db.collection("saves").updateOne(
      { telegramId },
      {
        $set: {
          telegramId,
          data,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json({ ok: true });
  });

  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Backend запущен: http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Ошибка запуска backend:", error);
  process.exit(1);
});
