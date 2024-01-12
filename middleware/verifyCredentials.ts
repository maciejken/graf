import { Request, Response, NextFunction } from "npm:express@4";
import { AuthType, authCheckMap } from "../services/authService.ts";

export async function verifyCredentials(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const { authorization } = req.headers;
    let isAuthenticated = false;

    if (authorization) {
      const [authType, authData] = authorization.split(" ");
      const verify = authCheckMap[authType as AuthType];
      isAuthenticated = await verify(authData);
    }

    next(isAuthenticated ? undefined : new Error("Unauthenticated"));
  } catch (_e: unknown) {
    next("Unexpected error");
  }
}
