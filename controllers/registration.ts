import { Request, Response } from "npm:express@4";
import { PublicKeyCredentialCreationOptionsJSON } from "https://deno.land/x/simplewebauthn@v9.0.0/deno/types.ts";
import {
  createNewAuthenticator,
  getNewAuthenticatorOptions,
  getRegistrationToken,
} from "../services/auth/authService.ts";
import { addUser } from "../services/user/userService.ts";
import { UserData } from "../types.ts";
import { relyingPartyId, relyingPartyName } from "../config.ts";
import { Authenticator } from "../services/auth/types.ts";

export async function createUser(req: Request, res: Response) {
  const { firstName, lastName, email, phone, password } = req.body;

  try {
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
  } catch (e) {
    console.error("Failed to create new user.", e);
  }
}

export async function getRegistrationScopeToken(_req: Request, res: Response) {
  try {
    const token = await getRegistrationToken(res.locals.user.id);
    res.json({ token });
  } catch (e) {
    console.error("Failed to get registration token.");
  }
}

export async function getRegistrationOptions(req: Request, res: Response) {
  const user: UserData = res.locals.user;
  const platform = req.query.platform === "true";

  try {
    const options: PublicKeyCredentialCreationOptionsJSON | null =
      await getNewAuthenticatorOptions({
        rpId: relyingPartyId!,
        rpName: relyingPartyName!,
        user,
        platform,
      });
    res.json(options);
  } catch (e) {
    console.error("Failed to get registration options.", e);
  }
}

export async function getRegistrationInfo(_req: Request, res: Response) {
  const user: UserData = res.locals.user;
  const registrationInfo: Authenticator = res.locals.registrationInfo;

  try {
    await createNewAuthenticator(user, registrationInfo);
    res.json(registrationInfo);
  } catch (e) {
    console.error("Failed to get registration info.", e);
  }
}
