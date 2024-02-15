export interface Document<T = number> {
  type: string;
  title: string;
  content: T;
  authorId: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt?: string;
}

export type DocumentType = 'counter' | 'note';

export interface Permission {
  subjectId: string;
  subjectType: 'user' | 'group',
  accessLevel: AccessLevel;
}

export enum AccessLevel {
  View,
  Update,
  Manage,
}