import { Request, Response } from "express";
import { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";
import {
  getAuthenticationOptions,
  getAuthenticationToken,
  getGenericToken,
} from "../services/auth/authService.ts";
import { VerifiedAuthenticationResponse } from "@simplewebauthn/server";
import { encrypt } from "../services/secretService.ts";

export async function getAuthOptions(req: Request, res: Response) {
  const options: PublicKeyCredentialRequestOptionsJSON | null =
    await getAuthenticationOptions(req.user);
  res.json(options);
}

export async function getAuthInfo(req: Request, res: Response) {
  const authInfo: VerifiedAuthenticationResponse["authenticationInfo"] =
    res.locals.authenticationInfo;

  let token: string | undefined;
  let encryptedToken: string | undefined;
  const publicKey = decodeURIComponent(req.body.publicKey);

  if (authInfo.userVerified) {
    token = await getGenericToken(req.user.id);
  }

  if (token && publicKey) {
    try {
      encryptedToken = await encrypt(token, publicKey);
    } catch (e) {
      console.error(`Failed to encrypt token: ${e}`);
    }
  }

  res.json({ ...authInfo, token: encryptedToken });
}

export async function getAuthenticationScopeToken(req: Request, res: Response) {
  try {
    const token = await getAuthenticationToken(req.user.id);
    res.json({ token });
  } catch (_e) {
    console.error("Failed to get authentication scope token.");
  }
}
