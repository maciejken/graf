export interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface User extends Omit<NewUser, 'password'> {
  id: string;
  credentialsId: string;
  groupIds: string[];
}

export interface UserData extends User {
  challenge?: string | undefined;
}