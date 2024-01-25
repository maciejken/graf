import express from "npm:express@4";
import { createHandler } from "npm:graphql-http/lib/use/express";
import cors from "npm:cors@2";
import { schema } from "./gql/schema.ts";
import { verifyCredentials } from "./middleware/verifyCredentials.ts";
import {
  createAuthenticator,
  createUser,
  getRegistrationOptions,
} from "./controllers/register.ts";
import { verifyClientRegistration } from "./middleware/verifyClientRegistration.ts";
import { expectedOrigin } from "./config.ts";

const app = express();

app.use(express.json());

app.use(cors({ origin: expectedOrigin }));

app.post("/register", createUser);

app.get("/register/options", verifyCredentials, getRegistrationOptions);

app.post(
  "/register/authenticator",
  verifyCredentials,
  verifyClientRegistration,
  createAuthenticator
);

app.use(
  "/graf",
  verifyCredentials,
  createHandler({
    schema,
  })
);

app.listen(4000, () => {
  console.log("Listening...");
});
