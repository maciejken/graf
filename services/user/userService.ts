import {
  authenticatorsPrefix,
  credentialsPrefix,
  usersPrefix,
} from "../../constants.ts";
import { NewUser, UserData } from "../../types.ts";
import {
  createCredentials,
  generatePasswordHash,
  getCredentials,
} from "../auth/authService.ts";
import { Credentials } from "../auth/types.ts";
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

export async function addUser({
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
      groupIds: []
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
      db.set([usersPrefix, id], {
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
    const credentials: Credentials | null = await getCredentials(
      user.credentialsId
    );
    const authenticatorIds: string[] = credentials?.authenticatorIds || [];
    const actions = [
      db.delete([usersPrefix, id]),
      db.delete([credentialsPrefix, user.credentialsId]),
    ];
    for (const authId of authenticatorIds) {
      actions.push(db.delete([authenticatorsPrefix, authId]));
    }
    await Promise.all([actions]);
  }

  return user ? getUserById(id) : null;
}
