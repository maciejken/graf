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

export type DocumentType = 'counter' | 'note';

export interface Permissions {
  [key: string]: AccessLevel;
}

export enum AccessLevel {
  None,
  View,
  Update,
  Manage,
}