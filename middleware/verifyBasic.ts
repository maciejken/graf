import { Request, Response, NextFunction } from "npm:express@4";
import { UserData } from "../types.ts";
import { verifyBasicAuth } from "../services/auth/authService.ts";

export async function verifyBasic(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { authorization } = req.headers;
    let authenticatedUser: UserData | null = null;

    if (authorization) {
      const [_authType, authData] = authorization.split(" ");
      authenticatedUser = await verifyBasicAuth(authData);
    }

    if (authenticatedUser) {
      res.locals.user = authenticatedUser;
    }

    next(authenticatedUser ? undefined : new Error("Unauthenticated"));
  } catch (_e: unknown) {
    next("Unexpected error");
  }
}
