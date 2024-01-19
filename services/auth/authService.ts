import { u2fAppId, u2fVersion } from "../../config.ts";
import { credentialsPrefix } from "../../constants.ts";
import { User, UserData } from "../../types.ts";
import { getDatabase } from "../dbService.ts";
import { AuthType, Credentials } from "./types.ts";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "https://deno.land/x/simplewebauthn/deno/server.ts";

const db = getDatabase();

function generateRandomString(): string {
  const array = new Uint32Array(10);
  return [...crypto.getRandomValues(array)]
    .map((num: number) => num.toString(16).padStart(2, "0"))
    .join("");
}

async function digestSaltedText(text: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer: ArrayBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`${text}${salt}`)
  );
  const hashArray: number[] = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b: number) => b.toString(16).padStart(2, "0")).join("");
}

export async function getCredentials(id: string): Promise<Credentials | null> {
  return (await db.get<Credentials>([credentialsPrefix, id])).value;
}

export async function generateCredentials(
  password: string
): Promise<Credentials> {
  const id: string = crypto.randomUUID();
  return {
    id,
    ...(await generatePasswordHash(password)),
  };
}

export async function createCredentials(password: string) {
  const credentials = await generateCredentials(password);
  await db.set([credentialsPrefix, credentials.id], credentials);
  return getCredentials(credentials.id);
}

export async function generatePasswordHash(
  password: string
): Promise<Omit<Credentials, "id">> {
  const salt: string = generateRandomString();
  const passwordHash: string = await digestSaltedText(password, salt);
  return { passwordHash, salt };
}

export function generateU2FRegistrationRequest() {
  if (!u2fAppId) {
    throw new Error("Unable to generate U2F request: appId must be provided.");
  }

  return {
    version: u2fVersion,
    challenge: generateRandomString(),
    appId: u2fAppId,
  };
}

async function verifyBasicAuth(auth: string) {
  let isAuthenticated = false;
  const decodedAuth = atob(auth);
  const [email, password] = decodedAuth.split(":");
  const entries = db.list<UserData>({ prefix: ["users"] });
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
  [AuthType.Bearer]: (auth: string) => Promise.resolve(false),
};
