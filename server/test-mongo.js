import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const uri = process.env.MONGODB_URI;

console.log("URI есть:", Boolean(uri));

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 15000
});

try {
  await client.connect();
  await client.db("admin").command({ ping: 1 });
  console.log("MongoDB подключилась успешно");
} catch (error) {
  console.error("Ошибка MongoDB:");
  console.error(error.message);
} finally {
  await client.close().catch(() => {});
}