import { relyingPartyId } from "../../config.ts";
import {
  authenticatorsPrefix,
  credentialsPrefix,
  usersPrefix,
} from "../../constants.ts";
import { UserData } from "../../types.ts";
import { getDatabase } from "../dbService.ts";
import { getUserById } from "../user/userService.ts";
import { AuthType, Authenticator, Credentials } from "./types.ts";
import {
  VerifiedRegistrationResponse,
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "https://deno.land/x/simplewebauthn/deno/server.ts";
import {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "https://deno.land/x/simplewebauthn@v9.0.0/deno/types.ts";

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

export async function getAuthenticator(
  id: string
): Promise<Authenticator | null> {
  return (await db.get<Authenticator>([authenticatorsPrefix, id])).value;
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

async function verifyBasicAuth(auth: string): Promise<UserData | null> {
  let authenticatedUser: UserData | null = null;
  const decodedAuth = atob(auth);
  const [email, password] = decodedAuth.split(":");
  let challenge: string | undefined;

  const entries = db.list<UserData>({ prefix: [usersPrefix] });
  for await (const { value: user } of entries) {
    if (user.email === email) {
      const { value: credentials } = await db.get<Credentials>([
        credentialsPrefix,
        user.credentialsId,
      ]);
      if (credentials?.passwordHash && credentials?.salt) {
        const passwordHash = await digestSaltedText(password, credentials.salt);
        if (passwordHash === credentials.passwordHash) {
          authenticatedUser = user;
          challenge = credentials.currentChallenge;
        }
      }
    }
  }
  return authenticatedUser ? { ...authenticatedUser, challenge } : null;
}

export const authCheckMap: Record<
  AuthType,
  (auth: string) => Promise<UserData | null>
> = {
  [AuthType.Basic]: (auth: string) => verifyBasicAuth(auth),
  [AuthType.Bearer]: (auth: string) => Promise.resolve(null),
};

export async function setAuthChallenge(
  userId: string,
  challenge: string
): Promise<boolean> {
  const user: UserData | null = await getUserById(userId);
  let result = false;

  if (user) {
    const credentials: Credentials | null = await getCredentials(
      user.credentialsId
    );

    if (!credentials) {
      throw new Error("Failed to set challenge: credentials not found.");
    }

    await db.set([credentialsPrefix, credentials.id], {
      ...credentials,
      currentChallenge: challenge,
    });

    result = true;
  }

  return result;
}

async function getAuthenticators(ids: string[]): Promise<Authenticator[]> {
  const authenticators: Authenticator[] = [];
  const promises: Array<Promise<Authenticator | null>> = ids.map((id: string) =>
    getAuthenticator(id)
  );

  for await (const result of promises) {
    if (result) {
      authenticators.push(result);
    }
  }

  return authenticators;
}

export async function getNewAuthenticatorOptions({
  userId,
  rpName,
  rpId,
}: {
  userId: string;
  rpName: string;
  rpId: string;
}): Promise<PublicKeyCredentialCreationOptionsJSON | null> {
  const user: UserData | null = await getUserById(userId);
  let options: PublicKeyCredentialCreationOptionsJSON | null = null;

  if (user) {
    const credentials: Credentials | null = await getCredentials(
      user?.credentialsId
    );

    if (!credentials) {
      throw new Error(
        "Failed to get authenticator options: credentials not found."
      );
    }

    let authenticators: Authenticator[] = [];

    if (credentials.authenticatorIds) {
      authenticators = await getAuthenticators(credentials.authenticatorIds);
    }

    options = await generateRegistrationOptions({
      rpName,
      rpID: rpId,
      userID: user.id,
      userName: user.email,
      attestationType: "none",
      // Prevent users from re-registering existing authenticators
      excludeCredentials: authenticators.map(
        (authenticator: Authenticator) => ({
          id: authenticator.id,
          type: "public-key",
          // Optional
          transports: authenticator.transports,
        })
      ),
      // See "Guiding use of authenticators via authenticatorSelection" below
      authenticatorSelection: {
        // Defaults
        residentKey: "preferred",
        userVerification: "preferred",
        // Optional
        authenticatorAttachment: "platform",
      },
    });

    const result: boolean = await setAuthChallenge(user.id, options.challenge);

    if (!result) {
      throw new Error("Failed to set challenge.");
    }
  }

  return options;
}

export function verifyRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string,
  origin: string
): Promise<VerifiedRegistrationResponse> {
  return verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: relyingPartyId,
  });
}