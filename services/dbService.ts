import { collections } from "../constants.ts";

const db = await Deno.openKv();

export function getDatabase(): Deno.Kv {
  return db;
}

export function clearDatabase() {
  collections.forEach(async (col) => {
    const entries = db.list({ prefix: [col] });
    for await (const entry of entries) {
      console.log("entry.key:", entry.key);
      await db.delete(entry.key);
    }
  });
  console.log("Database has been cleared.");
}
