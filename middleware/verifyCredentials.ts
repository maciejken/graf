import { Request, Response, NextFunction } from "npm:express@4";
import { authCheckMap } from "../services/auth/authService.ts";
import { AuthType } from "../services/auth/types.ts";
import { UserData } from "../types.ts";

export async function verifyCredentials(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { authorization } = req.headers;
    let authenticatedUser: UserData | null = null;

    if (authorization) {
      const [authType, authData] = authorization.split(" ");
      const verify = authCheckMap[authType as AuthType];
      authenticatedUser = await verify(authData);
    }

    if (authenticatedUser) {
      res.locals.userId = authenticatedUser.id;
    }

    next(authenticatedUser ? undefined : new Error("Unauthenticated"));
  } catch (_e: unknown) {
    next("Unexpected error");
  }
}
