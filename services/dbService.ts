const db = await Deno.openKv();

export function getDatabase(): Deno.Kv {
  return db;
}
