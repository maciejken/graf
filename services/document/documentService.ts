import { documentsPrefix } from "../../constants.ts";
import { Document, Permission } from "./types.ts";
import { getDatabase } from "../dbService.ts";
import { NewDocument } from "./types.ts";
import { DocumentWithAccesLevel } from "./types.ts";
import { AccessLevel } from "./types.ts";

const db = getDatabase();

export async function getAllDocuments(): Promise<Document[]> {
  const entries = db.list<Document>({ prefix: [documentsPrefix] });
  const docs: Document[] = [];
  for await (const { value } of entries) {
    docs.push(value);
  }
  return docs;
}

export async function getDocumentById(id: string): Promise<Document | null> {
  return (await db.get<Document>([documentsPrefix, id])).value;
}

export async function getUserDocuments(
  userId: string,
): Promise<DocumentWithAccesLevel[]> {
  const entries = db.list<Document>({ prefix: [documentsPrefix] });
  const userDocuments = [];
  for await (const { value } of entries) {
    const isUserDocument = value.userId === userId || value.permissions[userId];

    if (isUserDocument) {
      userDocuments.push(value);
    }
  }

  return userDocuments.map((
    d: Document,
  ) => ({
    ...d,
    accessLevel: d.permissions[userId] ||
      (d.userId === userId ? AccessLevel.Manage : AccessLevel.None),
  }));
}

export async function getGroupDocuments(
  groupId: string,
): Promise<DocumentWithAccesLevel[]> {
  const entries = db.list<Document>({ prefix: [documentsPrefix] });
  const groupDocuments = [];
  for await (const { value } of entries) {
    if (value.permissions[groupId]) {
      groupDocuments.push(value);
    }
  }
  return groupDocuments.map((d: Document) => ({
    ...d,
    accessLevel: d.permissions[groupId],
  }));
}

export async function addDocument({
  title,
  content,
  userId,
  type,
}: NewDocument): Promise<Document | null> {
  const id = crypto.randomUUID();
  await db.set([documentsPrefix, id], {
    id,
    type,
    title,
    content,
    userId,
    permissions: {},
    createdAt: new Date().toISOString(),
  });

  return getDocumentById(id);
}

export async function updateDocument(
  id: string,
  { type, title, content }: Omit<NewDocument, "userId">,
): Promise<Document | null> {
  let doc: Document | null = await getDocumentById(id);

  if (doc) {
    await db.set([documentsPrefix, id], {
      id,
      type: type || doc.type,
      title: title || doc.title,
      content: content || doc.content,
      userId: doc.userId, // creator
      permissions: doc.permissions,
      createdAt: doc.createdAt,
      updatedAt: new Date().toISOString(),
    });

    doc = await getDocumentById(id);
  }

  return doc;
}

export async function updateDocumentPermissions(
  id: string,
  permissions: Permission[],
): Promise<Document | null> {
  const doc: Document | null = await getDocumentById(id);

  if (doc) {
    await db.set([documentsPrefix, id], {
      ...doc,
      permissions: {
        ...doc.permissions,
        ...Object.fromEntries(
          permissions.map(({ id, value }: Permission) => [id, value]),
        ),
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return getDocumentById(id);
}

export async function deleteDocument(id: string): Promise<Document | null> {
  await db.delete([documentsPrefix, id]);

  return getDocumentById(id);
}
