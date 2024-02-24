import { NextFunction, Request, Response } from "express";
import { UserData } from "../services/user/types.ts";
import {
  getCredentials,
  verifyAuthenticationToken,
} from "../services/auth/authService.ts";
import { JwtPayload } from "npm:@types/jsonwebtoken";
import { getUserById } from "../services/user/userService.ts";
import { Credentials } from "../services/auth/types.ts";

export async function verifyAuthenticationScopeToken(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const { authorization } = req.headers;
    let authenticatedUser: UserData | null = null;

    if (authorization) {
      const [_authType, token] = authorization.split(" ");
      const verifiedToken: JwtPayload = await verifyAuthenticationToken(token);
      authenticatedUser = await getUserById(verifiedToken.sub!);
    }

    if (authenticatedUser) {
      const credentials: Credentials | null = await getCredentials(
        authenticatedUser.credentialsId,
      );
      req.user = {
        ...authenticatedUser,
        challenge: credentials?.currentChallenge,
      };
    }

    next(authenticatedUser ? undefined : new Error("Unauthenticated"));
  } catch (_e: unknown) {
    next("Unexpected error");
  }
}
