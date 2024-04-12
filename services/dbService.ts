import { collections } from "../constants.ts";

const db = await Deno.openKv();

export function getDatabase(): Deno.Kv {
  return db;
}

export async function clearDatabase(): Promise<void> {
  const promises = collections.map(async (col) => {
    const entries = db.list({ prefix: [col] });
    for await (const entry of entries) {
      if ("string" === typeof entry.key) {
        await db.delete([col, entry.key]);
      }
    }
  });
  await Promise.all(promises);
  console.log("Database has been cleared.");
}
