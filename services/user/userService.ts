import { credentialsPrefix, usersPrefix } from "../../constants.ts";
import { NewUser, UserData } from "../../types.ts";
import {
  createCredentials,
  generatePasswordHash,
} from "../auth/authService.ts";
import { getDatabase } from "../dbService.ts";

const db = getDatabase();

export async function getAllUsers(): Promise<UserData[]> {
  const entries = db.list<UserData>({ prefix: [usersPrefix] });
  const users: UserData[] = [];
  for await (const { value } of entries) {
    users.push(value);
  }
  return users;
}

export async function getUserById(id: string): Promise<UserData | null> {
  return (await db.get<UserData>([usersPrefix, id])).value;
}

export async function getUserByEmail(email: string): Promise<UserData | null> {
  const entries = db.list<UserData>({ prefix: [usersPrefix] });
  let user: UserData | null = null;
  for await (const { value } of entries) {
    if (value.email === email) {
      user = value;
      break;
    }
  }
  return user;
}

export async function createUser({
  firstName,
  lastName,
  email,
  phone,
  password,
}: NewUser): Promise<UserData | null> {
  const userId = crypto.randomUUID();
  const credentials = await createCredentials(password);

  if (credentials) {
    await db.set(["users", userId], {
      id: userId,
      firstName,
      lastName,
      email,
      phone,
      credentialsId: credentials.id,
    });
  }

  return getUserById(userId);
}

export async function updateUser(
  id: string,
  { firstName, lastName, email, phone, password }: NewUser
): Promise<UserData | null> {
  const user: UserData | null = await getUserById(id);

  const shouldUpdateUser =
    !!user && !!(firstName || lastName || email || phone);
  const shouldUpdateCredentials = !!(password && user?.credentialsId);
  const updates = [];
  if (shouldUpdateCredentials) {
    updates.push(
      db.set([credentialsPrefix, user.credentialsId], {
        id: user.credentialsId,
        ...(await generatePasswordHash(password)),
      })
    );
  }

  if (shouldUpdateUser) {
    updates.push(
      db.set([usersPrefix], {
        id,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        email: email || user.email,
        phone: phone || user.phone,
        credentialsId: user.credentialsId,
      })
    );
  }
  await Promise.all(updates);
  return getUserById(id);
}

export async function deleteUser(id: string): Promise<UserData | null> {
  const user: UserData | null = await getUserById(id);

  if (user) {
    await Promise.all([
      db.delete([usersPrefix, id]),
      db.delete([credentialsPrefix, user.credentialsId]),
    ]);
  }

  return user ? getUserById(id) : null;
}
