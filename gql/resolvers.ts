import { Context } from "../types.ts";

export const rootValue = {
  viewer: (_args: any, context: Context) => {
    return {
      user: context.user,
    };
  },
};
