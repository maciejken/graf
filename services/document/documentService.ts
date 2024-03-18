import { documentsPrefix } from "../../constants.ts";
import { Document, Permission } from "./types.ts";
import { getDatabase } from "../dbService.ts";
import { NewDocument } from "./types.ts";
import { DocumentWithAccesLevel } from "./types.ts";
import { AccessLevel } from "./types.ts";
import { getUserGroups } from "../group/groupService.ts";
import { User } from "../user/types.ts";
import { Group } from "../group/types.ts";

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
  user: User,
): Promise<DocumentWithAccesLevel[]> {
  const entries = db.list<Document>({ prefix: [documentsPrefix] });
  const userDocuments = [];
  for await (const { value } of entries) {
    const isUserDocument = value.userId === user.id ||
      value.permissions[user.email];

    if (isUserDocument) {
      userDocuments.push(value);
    }
  }

  const docsWithAccessLevels = userDocuments.map((
    d: Document,
  ) => ({
    ...d,
    accessLevel: d.userId === user.id
      ? AccessLevel.Delete
      : d.permissions[user.email] ||
        AccessLevel.None,
  }));

  docsWithAccessLevels.sort((d1, d2) =>
    new Date(d2.createdAt).getTime() - new Date(d1.createdAt).getTime()
  );

  return docsWithAccessLevels;
}

export async function getGroupDocuments(
  group: Group,
): Promise<DocumentWithAccesLevel[]> {
  const entries = db.list<Document>({ prefix: [documentsPrefix] });
  const groupDocuments = [];
  for await (const { value } of entries) {
    if (value.permissions[group.name]) {
      groupDocuments.push(value);
    }
  }
  return groupDocuments.map((d: Document) => ({
    ...d,
    accessLevel: d.permissions[group.name],
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

export async function getDocumentAccessLevel(
  document: Document,
  viewer: User,
): Promise<AccessLevel> {
  const userAccessLvl: AccessLevel = viewer.id === document.userId
    ? AccessLevel.Delete
    : document.permissions[viewer.email] || AccessLevel.None;

  const userGroups = await getUserGroups(viewer.id);
  const groupAccessLvl = Math.max(
    ...userGroups.map((group) =>
      document?.permissions[group.name] || AccessLevel.None
    ),
  );

  return Math.max(userAccessLvl, groupAccessLvl);
}

export async function updateDocument(
  id: string,
  {
    type,
    title,
    content,
    viewer,
  }: Omit<NewDocument, "userId"> & { viewer: User },
): Promise<DocumentWithAccesLevel | null> {
  let doc: Document | null = await getDocumentById(id);
  let accessLevel: AccessLevel = AccessLevel.None;

  if (doc) {
    accessLevel = await getDocumentAccessLevel(doc, viewer);
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
  { permissions, viewer }: {
    permissions: Permission[];
    viewer: User;
  },
): Promise<DocumentWithAccesLevel | null> {
  let doc: Document | null = await getDocumentById(id);
  let accessLevel: AccessLevel = AccessLevel.None;

  if (doc) {
    accessLevel = await getDocumentAccessLevel(doc, viewer);
    accessLevel > AccessLevel.Update && await db.set([documentsPrefix, id], {
      ...doc,
      permissions: {
        ...doc.permissions,
        ...Object.fromEntries(
          permissions.map(({ key, value }: Permission) => [key, value]),
        ),
      },
      updatedAt: new Date().toISOString(),
    });

    doc = await getDocumentById(id);
  }

  return doc && { ...doc, accessLevel };
}

export async function deleteDocument(
  id: string,
  viewer: User,
): Promise<Document | null> {
  const doc: Document | null = await getDocumentById(id);

  if (doc) {
    const accessLevel = await getDocumentAccessLevel(doc, viewer);
    accessLevel === AccessLevel.Delete &&
      await db.delete([documentsPrefix, id]);
  }

  return getDocumentById(id);
}
