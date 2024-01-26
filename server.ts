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
import { checkConfig, envName, expectedOrigin, host, port } from "./config.ts";
import { getAuthOptions, getAuthInfo } from "./controllers/authentication.ts";
import { verifyClientAuthentication } from "./middleware/verifyClientAuthentication.ts";

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

app.post(
  "/authentication/info",
  verifyCredentials,
  verifyClientAuthentication,
  getAuthInfo
);

app.use(
  "/graf",
  verifyCredentials,
  createHandler({
    schema,
  })
);

const prefix = envName === "dev" ? "http://" : "https://";
app.listen(port, () => {
  console.log(`Listening at ${prefix}${host}:${port}`);
});
