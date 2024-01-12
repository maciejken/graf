import { Request, Response, NextFunction } from "npm:express@4";
import { whitelistedIps } from "../../config.ts";

export function ensureAuthenticated(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const { remoteAddress } = req.socket;
  const isAuthenticated =
    !remoteAddress || whitelistedIps?.includes(remoteAddress);

  if (isAuthenticated) {
    next();
  } else {
    next(new Error(`Unauthenticated: ${req.socket.remoteAddress}`));
  }
}
