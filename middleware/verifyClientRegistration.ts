import { Request, Response, NextFunction } from "npm:express@4";
import { verifyRegistration } from "../services/auth/authService.ts";

export async function verifyClientRegistration(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user;
  let error: Error | null = null;

  if (!user.challenge) {
    error = new Error("Failed to verify client due to missing challenge.");
  }

  if (!req.headers.origin) {
    error = new Error("Failed to verify client due to missing origin.");
  }

  const result = await verifyRegistration(req.body, user.challenge);

  if (!result.verified || !result.registrationInfo) {
    error = new Error("Failed to verify client.");
  }

  res.locals.registrationInfo = result.registrationInfo;

  next(result.verified ? undefined : error);
}
