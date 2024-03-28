import { Context } from "../types.ts";

export const rootValue = {
  viewer: (_args: undefined, context: Context) => {
    const { id, firstName, lastName, email, phone, groupIds } = context.user;
    return {
      id,
      firstName,
      lastName,
      email,
      phone,
      groupIds,
    };
  },
};

export * from "./documentResolvers.ts";
