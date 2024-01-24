export interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface NewUser extends User {
  password: string;
}

export interface UserData extends User {
  id: string;
  credentialsId: string;
  challenge?: string | undefined;
}

export interface Document {
  id: string;
  userId: string;
  content: string;
  contentType: string;
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
