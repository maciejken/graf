import { Application } from "../../types.ts";
import { getDatabase } from "../dbService.ts";

const db = getDatabase();

export async function getApplicationsByDocumentId(
  documentId: string
): Promise<Application[]> {
  const entries = db.list<Application>({
    prefix: ["applications"],
  });
  const docApplications = [];
  for await (const { value } of entries) {
    if (value.documentId === documentId) {
      docApplications.push(value);
    }
  }
  return docApplications;
}
