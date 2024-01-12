export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  credentialsId: string;
}

enum ContentType {
  Memo = "memo",
  Resume = "resume",
}

export interface Document {
  id: string;
  userId: string;
  content: string;
  contentType: ContentType;
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
