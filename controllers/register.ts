import { Request, Response } from "npm:express@4";

export function createUser(req: Request, res: Response) {
  res.json({ post: "user" });
}

export function createAuthenticator(req: Request, res: Response) {
  res.json({ post: "authenticator" });
}
