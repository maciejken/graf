import { Request, Response, NextFunction } from "npm:express@4";
import { UserData } from "../types.ts";
import { getUserByEmail } from "../services/user/userService.ts";

export async function checkUsernameAvailable(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const { email } = req.body;
    const user: UserData | null = await getUserByEmail(email);

    next(!user ? undefined : new Error("Username not available."));
  } catch (_e: unknown) {
    next("Unexpected error");
  }
}
