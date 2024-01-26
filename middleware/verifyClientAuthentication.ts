import { Request, Response, NextFunction } from "npm:express@4";
import {
  getAuthenticator,
  getCredentials,
  verifyAuthentication,
} from "../services/auth/authService.ts";
import { Authenticator, Credentials } from "../services/auth/types.ts";

export async function verifyClientAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user;
  let error: Error | null = null;
  const authenticatorId: string = req.body.id;
  let result = null;

  if (!user?.challenge) {
    error = new Error("Failed to verify client due to missing challenge.");
  }

  if (!req.headers.origin) {
    error = new Error("Failed to verify client due to missing origin.");
  }

  if (!authenticatorId) {
    error = new Error(
      "Failed to verify client due to missing authenticator id."
    );
  }

  const authenticator: Authenticator | null = await getAuthenticator(
    authenticatorId
  );

  if (authenticator) {
    result = await verifyAuthentication(
      req.body,
      user.challenge,
      authenticator
    );
  }

  console.log("req.body", req.body);
  console.log("authenticator", authenticator);
  console.log("authenticationInfo", result);

  const credentials: Credentials | null = await getCredentials(
    res.locals.user.credentialsId
  );

  console.log("authenticator ids:", credentials?.authenticatorIds);

  if (!result?.verified || !result?.authenticationInfo) {
    error = new Error("Failed to verify client.");
  }

  if (!error) {
    res.locals.authenticationInfo = result?.authenticationInfo;
  }

  next(result?.verified ? undefined : error);
}
