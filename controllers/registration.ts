import { Request, Response } from "npm:express@4";
import { PublicKeyCredentialCreationOptionsJSON } from "https://deno.land/x/simplewebauthn@v9.0.0/deno/types.ts";
import {
  createNewAuthenticator,
  getNewAuthenticatorOptions,
} from "../services/auth/authService.ts";
import { addUser } from "../services/user/userService.ts";
import { UserData } from "../types.ts";
import { relyingPartyId, relyingPartyName } from "../config.ts";
import { Authenticator } from "../services/auth/types.ts";

export async function createUser(req: Request, res: Response) {
  const { firstName, lastName, email, phone, password } = req.body;
  const user: UserData | null = await addUser({
    firstName,
    lastName,
    email,
    phone,
    password,
  });
  res.json({
    id: user?.id,
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    phone: user?.phone,
  });
}

export async function getRegistrationOptions(_req: Request, res: Response) {
  const user: UserData = res.locals.user;
  const options: PublicKeyCredentialCreationOptionsJSON | null =
    await getNewAuthenticatorOptions({
      rpId: relyingPartyId,
      rpName: relyingPartyName,
      user,
    });
  res.json(options);
}

export async function createAuthenticator(_req: Request, res: Response) {
  const user: UserData = res.locals.user;
  const registrationInfo: Authenticator = res.locals.registrationInfo;
  const newAuthenticator: Authenticator = await createNewAuthenticator(
    user,
    registrationInfo
  );

  res.json(newAuthenticator);
}
