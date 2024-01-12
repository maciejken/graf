import { User } from "../schema/types.ts";
import { getDatabase } from "./dbService.ts";

const db = getDatabase();

export interface Credentials {
  salt?: string;
  passwordHash?: string;
}

export enum AuthType {
  Basic = "Basic",
  Bearer = "Bearer",
}

function generateSalt(): string {
  const array = new Uint32Array(10);
  return [...crypto.getRandomValues(array)]
    .map((num: number) => num.toString(16).padStart(2, "0"))
    .join("");
}

interface PasswordDigestData {
  passwordHash: string;
  salt: string;
}

async function digestSaltedText(text: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer: ArrayBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`${text}-${salt}`)
  );
  const hashArray: number[] = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b: number) => b.toString(16).padStart(2, "0")).join("");
}

export async function getPasswordDigestData(
  password: string
): Promise<PasswordDigestData> {
  const salt: string = generateSalt();
  const passwordHash: string = await digestSaltedText(password, salt);
  return {
    passwordHash,
    salt,
  };
}

async function verifyBasicAuth(auth: string) {
  let isAuthenticated = false;
  const decodedAuth = atob(auth);
  const [email, password] = decodedAuth.split(":");
  const entries = db.list<User>({ prefix: ["users"] });
  for await (const { value: user } of entries) {
    if (user.email === email) {
      const { value: credentials } = await db.get<Credentials>([
        "credentials",
        user.credentialsId,
      ]);
      if (credentials?.passwordHash && credentials?.salt) {
        const passwordHash = await digestSaltedText(password, credentials.salt);
        isAuthenticated = passwordHash === credentials.passwordHash;
      }
    }
  }
  return isAuthenticated;
}

export const authCheckMap: Record<
  AuthType,
  (auth: string) => Promise<boolean>
> = {
  [AuthType.Basic]: (auth: string) => verifyBasicAuth(auth),
  [AuthType.Bearer]: (auth: string) => Promise.resolve(!!auth),
};
