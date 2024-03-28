import {
  addDocument,
  deleteDocument,
  getDocumentAccessLevel,
  getDocumentById,
  getUserDocuments,
  updateDocument,
  updateDocumentPermissions,
} from "../services/document/documentService.ts";
import {
  AccessLevel,
  DocumentWithAccesLevel,
} from "../services/document/types.ts";
import {
  Document,
  NewDocument,
  Permission,
} from "../services/document/types.ts";
import { User } from "../services/user/types.ts";
import { Context } from "../types.ts";

export async function resolveUserDocuments(
  viewer: User,
  { first, after: afterStr }: { first: number; after: string },
) {
  const count = first ?? Infinity;
  const after = parseInt(afterStr, 10) || 0;
  const next = count + after;
  const documents = await getUserDocuments(viewer);
  return {
    pageInfo: {
      hasNextPage: documents.length >= next,
      endCursor: "" + next,
    },
    edges: documents.slice(after, next).map((node) => ({
      node,
      cursor: node.id,
    })),
  };
}

export async function resolveDocument(
  _parentValue: undefined,
  { id }: Document,
  context: Context,
): Promise<DocumentWithAccesLevel | null> {
  const document: Document | null = await getDocumentById(id);
  let accessLevel = AccessLevel.None;

  if (document) {
    accessLevel = await getDocumentAccessLevel(document, context.user);
  }

  return document && accessLevel ? { ...document, accessLevel } : null;
}

export async function resolveNewDocument(
  _parentValue: User | undefined,
  { type, title, content }: NewDocument,
  context: Context,
) {
  const newDocument = await addDocument({
    type,
    title,
    content,
    userId: context.user.id,
  });
  return {
    viewer: context.user,
    documentEdge: {
      node: newDocument,
    },
  };
}

export async function resolveDocumentUpdate(
  _parentValue: User | undefined,
  args: Document,
  context: Context,
) {
  const updatedDocument = await updateDocument(args.id, {
    ...args,
    viewer: context.user,
  });
  return {
    viewer: context.user,
    documentEdge: {
      node: updatedDocument,
    },
  };
}

export async function resolveDocumentPermissionsUpdate(
  _parentValue: User | undefined,
  { id, permissions }: { id: string; permissions: Permission[] },
  context: Context,
) {
  await updateDocumentPermissions(id, {
    permissions,
    viewer: context.user,
  });
  return {
    viewer: context.user,
  };
}

export async function resolveDocumentRemoval(
  _parentValue: User | undefined,
  { id }: Document,
  context: Context,
) {
  await deleteDocument(id, context.user);
  return { viewer: context.user };
}
