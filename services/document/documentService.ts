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

export async function addDocument({
  title,
  content,
  userId,
  type,
}: Omit<Document, 'id'>): Promise<Document | null> {
  const id = crypto.randomUUID();
  await db.set([documentsPrefix, id], {
    id,
    type,
    title,
    content,
    userId,
    permissions: [],
    createdAt: new Date().toISOString(),
  });

  return getDocumentById(id);
}



export async function updateDocument(
  id: string,
  { type, title, content, permissions }: Document
): Promise<Document | null> {
  let doc: Document | null = await getDocumentById(id);

  if (doc) {
    await db.set([documentsPrefix, id], {
      id,
      type: type || doc.type,
      title: title || doc.title,
      content: content || doc.content,
      userId: doc.userId, // creator
      permissions: permissions || doc.permissions,
      createdAt: doc.createdAt,
      updatedAt: new Date().toISOString(),
    });
    
    doc = await getDocumentById(id);
  }

  return doc;
}

export async function deleteDocument(id: string): Promise<Document | null> {
  await db.delete([documentsPrefix, id]);

  return getDocumentById(id);
}
