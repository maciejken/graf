export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  groupIds: string[];
}

export interface NewUser extends Omit<User, 'id'> {
  password: string;
}

export interface UserData extends User {
  credentialsId: string;
  challenge?: string | undefined;
}

type DocumentType = 'counter' | 'note';

interface Permission {
  subjectId: string;
  subjectType: 'user' | 'group',
  accessLevel: AccessLevel;
}

export enum AccessLevel {
  View,
  Modify,
  FullAccess,
}

export interface Document<T = number> {
  id: string;
  type: DocumentType;
  userId: string;
  permissions: Permission[];
  title: string;
  content: T;
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
}

export interface Application {
  id: string;
  date: string;
  position: string;
  description: string;
  documentId: string;
  companyId: string;
}
