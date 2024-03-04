import { documentsPrefix } from "../../constants.ts";
import { Document, Permission } from "./types.ts";
import { getDatabase } from "../dbService.ts";
import { NewDocument } from "./types.ts";
import { DocumentWithAccesLevel } from "./types.ts";
import { AccessLevel } from "./types.ts";
import { getUserGroups } from "../group/groupService.ts";

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
}: NewDocument): Promise<DocumentWithAccesLevel | null> {
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

  const newDocument = await getDocumentById(id);

  return newDocument && { ...newDocument, accessLevel: AccessLevel.Delete };
}

async function getDocumentAccessLevel(
  document: Document,
  userId: string,
): Promise<AccessLevel> {
  const userAccessLvl: AccessLevel = userId === document.userId
    ? AccessLevel.Delete
    : document.permissions[userId] || AccessLevel.None;

  const userGroups = await getUserGroups(userId);
  const groupAccessLvl = Math.max(
    ...userGroups.map((g) => document?.permissions[g.id] || AccessLevel.None),
  );

  return Math.max(userAccessLvl, groupAccessLvl);
}

export async function updateDocument(
  id: string,
  {
    type,
    title,
    content,
    contributorId,
  }: Omit<NewDocument, "userId"> & { contributorId: string },
): Promise<DocumentWithAccesLevel | null> {
  let doc: Document | null = await getDocumentById(id);
  let accessLevel: AccessLevel = AccessLevel.None;

  if (doc) {
    accessLevel = await getDocumentAccessLevel(doc, contributorId);
    accessLevel > AccessLevel.View && await db.set([documentsPrefix, id], {
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

  return doc && { ...doc, accessLevel };
}

export async function updateDocumentPermissions(
  id: string,
  { permissions, contributorId }: {
    permissions: Permission[];
    contributorId: string;
  },
): Promise<DocumentWithAccesLevel | null> {
  let doc: Document | null = await getDocumentById(id);
  let accessLevel: AccessLevel = AccessLevel.None;

  if (doc) {
    accessLevel = await getDocumentAccessLevel(doc, contributorId);
    accessLevel > AccessLevel.Update && await db.set([documentsPrefix, id], {
      ...doc,
      permissions: {
        ...doc.permissions,
        ...Object.fromEntries(
          permissions.map(({ id, value }: Permission) => [id, value]),
        ),
      },
      updatedAt: new Date().toISOString(),
    });

    doc = await getDocumentById(id);
  }

  return doc && { ...doc, accessLevel };
}

export async function deleteDocument(id: string): Promise<Document | null> {
  await db.delete([documentsPrefix, id]);

  return getDocumentById(id);
}
