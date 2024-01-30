import { Request, Response } from "npm:express@4";
import { PublicKeyCredentialRequestOptionsJSON } from "https://deno.land/x/simplewebauthn@v9.0.0/deno/types.ts";
import {
  getAuthenticationOptions,
  getAuthenticationToken,
  getGenericToken,
} from "../services/auth/authService.ts";

export async function getAuthOptions(_req: Request, res: Response) {
  const options: PublicKeyCredentialRequestOptionsJSON | null =
    await getAuthenticationOptions(res.locals.user);
  res.json(options);
}

export function getAuthInfo(_req: Request, res: Response) {
  res.json(res.locals.authenticationInfo);
}

export function getAuthenticationScopeToken(_req: Request, res: Response) {
  try {
    const token = getAuthenticationToken(res.locals.user.id);
    res.json({ token });
  } catch (e) {
    console.error("Failed to get authentication scope token.");
  }
}

export function getGenericScopeToken(_req: Request, res: Response) {
  try {
    const token = getGenericToken(res.locals.user.id);
    res.json(token);
  } catch (e) {
    console.error("Failed to get generic scope token.");
  }
}
