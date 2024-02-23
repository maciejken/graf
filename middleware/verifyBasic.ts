import { NextFunction, Request, Response } from "express";
import { UserData } from "../services/user/types.ts";
import { verifyBasicAuth } from "../services/auth/authService.ts";

export async function verifyBasic(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const { authorization } = req.headers;
    let authenticatedUser: UserData | null = null;

    if (authorization) {
      const [_authType, authData] = authorization.split(" ");
      authenticatedUser = await verifyBasicAuth(authData);
    }

    if (authenticatedUser) {
      req.user = authenticatedUser;
    }

    next(authenticatedUser ? undefined : new Error("Unauthenticated"));
  } catch (_e: unknown) {
    next("Unexpected error");
  }
}
