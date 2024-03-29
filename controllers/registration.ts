import { Request, Response } from "express";
import { PublicKeyCredentialCreationOptionsJSON } from "https://deno.land/x/simplewebauthn@v9.0.0/deno/types.ts";
import {
  createNewAuthenticator,
  getNewAuthenticatorOptions,
  getRegistrationToken,
} from "../services/auth/authService.ts";
import { addUser } from "../services/user/userService.ts";
import { UserData } from "../services/user/types.ts";
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
  } catch (_e) {
    console.error("Failed to create new user.");
  }
}

export async function getRegistrationScopeToken(req: Request, res: Response) {
  try {
    const token = await getRegistrationToken(req.user.id);
    res.json({ token });
  } catch (_e) {
    console.error("Failed to get registration token.");
  }
}

export async function getRegistrationOptions(req: Request, res: Response) {
  const user: UserData = req.user;
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
  } catch (_e) {
    console.error("Failed to get registration options.");
  }
}

export async function getRegistrationInfo(req: Request, res: Response) {
  const user: UserData = req.user;
  const registrationInfo: Authenticator = res.locals.registrationInfo;

  try {
    await createNewAuthenticator(user, registrationInfo);
    res.json(registrationInfo);
  } catch (_e) {
    console.error("Failed to get registration info.");
  }
}
