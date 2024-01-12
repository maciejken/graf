import { Request, Response, NextFunction } from "npm:express@4";
import { whitelistedIps } from "../../config.ts";

export function ensureAuthenticated(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const isAuthenticated = whitelistedIps?.includes(req.ip);

  if (isAuthenticated) {
    console.log("req.ip", req.ip);
    console.log("req.connection.remoteAddress", req.connection.remoteAddress);
    console.log("req.socket.remoteAddress", req.socket.remoteAddress);
    console.log(
      "req.headers['x-forwarded-for']",
      req.headers["x-forwarded-for"]
    );
    console.log("req.ips", req.ips);
    next();
  } else {
    next(new Error(`Unauthenticated: ${req.socket.remoteAddress}`));
  }
}
