import { documentsPrefix } from "../../constants.ts";
import { Document } from "../../types.ts";
import { getDatabase } from "../dbService.ts";

const db = getDatabase();

export async function getDocumentById(id: string): Promise<Document | null> {
  return (await db.get<Document>([documentsPrefix, id])).value;
}

export async function getDocumentsByUserId(
  userId: string
): Promise<Document[]> {
  const entries = db.list<Document>({ prefix: [documentsPrefix] });
  const userDocuments = [];
  for await (const { value } of entries) {
    if (value.userId === userId) {
      userDocuments.push(value);
    }
  }
  return userDocuments;
}
