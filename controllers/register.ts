import { Request, Response } from "npm:express@4";
import { PublicKeyCredentialCreationOptionsJSON } from "https://deno.land/x/simplewebauthn@v9.0.0/deno/types.ts";
import { getNewAuthenticatorOptions } from "../services/auth/authService.ts";
import { addUser } from "../services/user/userService.ts";
import { UserData } from "../types.ts";
import { relyingPartyId, relyingPartyName } from "../config.ts";

export async function createUser(req: Request, res: Response) {
  const { firstName, lastName, email, phone, password } = req.body;
  const user: UserData | null = await addUser({
    firstName,
    lastName,
    email,
    phone,
    password,
  });
  res.json({ user });
}

export async function getRegistrationOptions(_req: Request, res: Response) {
  const options: PublicKeyCredentialCreationOptionsJSON | null =
    await getNewAuthenticatorOptions({
      rpId: relyingPartyId,
      rpName: relyingPartyName,
      userId: res.locals.userId,
    });
  res.json({ options });
}

export function createAuthenticator(req: Request, res: Response) {
  res.json({ post: "authenticator" });
}
