export interface NewDocument {
  type: string;
  title: string;
  content: string;
  userId: string;
}

export interface Document extends NewDocument {
  id: string;
  permissions: Permissions;
  createdAt: string;
  updatedAt?: string;
}

export type DocumentWithAccesLevel = Document & { accessLevel: AccessLevel };

export type DocumentType = "counter" | "note";

export interface Permissions {
  [id: string]: AccessLevel;
}

export interface Permission {
  id: string;
  value: AccessLevel;
}

export enum AccessLevel {
  None,
  View,
  Update,
  Manage,
  Delete,
}
