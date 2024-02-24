import { dbUrl } from "../config.ts";

const db = await Deno.openKv(dbUrl);

export function getDatabase(): Deno.Kv {
  return db;
}
