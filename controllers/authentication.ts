import { Request, Response } from "npm:express@4";
import { PublicKeyCredentialRequestOptionsJSON } from "https://deno.land/x/simplewebauthn@v9.0.0/deno/types.ts";
import {
  getAuthenticationOptions,
  getAuthenticationToken,
  getGenericToken,
} from "../services/auth/authService.ts";
import { VerifiedAuthenticationResponse } from "@simplewebauthn/server";

export async function getAuthOptions(req: Request, res: Response) {
  const options: PublicKeyCredentialRequestOptionsJSON | null =
    await getAuthenticationOptions(req.user);
  res.json(options);
}

export async function getAuthInfo(req: Request, res: Response) {
  const authInfo: VerifiedAuthenticationResponse["authenticationInfo"] =
    res.locals.authenticationInfo;

  let token: string | undefined;

  if (authInfo.userVerified) {
    token = await getGenericToken(req.user.id);
  }

  res.json({ ...authInfo, token });
}

export async function getAuthenticationScopeToken(
  req: Request,
  res: Response
) {
  try {
    const token = await getAuthenticationToken(req.user.id);
    res.json({ token });
  } catch (_e) {
    console.error("Failed to get authentication scope token.");
  }
}
