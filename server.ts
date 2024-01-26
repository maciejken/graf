import express from "npm:express@4";
import { createHandler } from "npm:graphql-http/lib/use/express";
import cors from "npm:cors@2";
import { schema } from "./gql/schema.ts";
import { verifyCredentials } from "./middleware/verifyCredentials.ts";
import {
  createAuthenticator,
  createUser,
  getRegistrationOptions,
} from "./controllers/registration.ts";
import { verifyClientRegistration } from "./middleware/verifyClientRegistration.ts";
import { checkConfig, expectedOrigin } from "./config.ts";
import { getAuthOptions } from "./controllers/authentication.ts";

const app = express();

checkConfig();

app.use(express.json());

app.use(cors({ origin: expectedOrigin }));

app.post("/registration", createUser);

app.get("/registration/options", verifyCredentials, getRegistrationOptions);

app.post(
  "/registration/authenticator",
  verifyCredentials,
  verifyClientRegistration,
  createAuthenticator
);

app.get("/authentication/options", verifyCredentials, getAuthOptions);

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
