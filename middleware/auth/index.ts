import { Request, Response, NextFunction } from "npm:express@4";
import { whitelistedIps } from "../../config.ts";

export function ensureAuthenticated(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const isAuthenticated = whitelistedIps?.includes(req.ip);
  console.debug("req.ip", req.ip);
  console.debug("req.connection.remoteAddress", req.connection.remoteAddress);
  console.debug("req.socket.remoteAddress", req.socket.remoteAddress);
  console.debug(
    "req.headers['x-forwarded-for']",
    req.headers["x-forwarded-for"]
  );
  console.debug("req.ips", req.ips);

  if (isAuthenticated) {
    next();
  } else {
    next(new Error(`Unauthenticated: ${req.socket.remoteAddress}`));
  }
}
