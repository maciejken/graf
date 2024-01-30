import express from "npm:express@4";
import { createHandler } from "npm:graphql-http/lib/use/express";
import cors from "npm:cors@2";
import { schema } from "./gql/schema.ts";
import { verifyBasic } from "./middleware/verifyBasic.ts";
import {
  createUser,
  getRegistrationInfo,
  getRegistrationOptions,
  getRegistrationScopeToken,
} from "./controllers/registration.ts";
import { verifyClientRegistration } from "./middleware/verifyClientRegistration.ts";
import { checkConfig, envName, expectedOrigin, host, port } from "./config.ts";
import {
  getAuthOptions,
  getAuthInfo,
  getAuthenticationScopeToken,
} from "./controllers/authentication.ts";
import { verifyClientAuthentication } from "./middleware/verifyClientAuthentication.ts";
import { verifyRegistrationScopeToken } from "./middleware/verifyRegistrationScopeToken.ts";
import { checkUsernameAvailable } from "./middleware/checkUsernameAvailable.ts";
import { verifyAuthenticationScopeToken } from "./middleware/verifyAuthenticationScopeToken.ts";

const app = express();

checkConfig();

app.use(express.json());

app.use(cors({ origin: expectedOrigin }));

app.post("/registration", checkUsernameAvailable, createUser);

app.get("/registration/token", verifyBasic, getRegistrationScopeToken);

app.get(
  "/registration/options",
  verifyRegistrationScopeToken,
  getRegistrationOptions
);

app.post(
  "/registration/info",
  verifyRegistrationScopeToken,
  verifyClientRegistration,
  getRegistrationInfo
);

app.get("/authentication/token", verifyBasic, getAuthenticationScopeToken);

app.get(
  "/authentication/options",
  verifyAuthenticationScopeToken,
  getAuthOptions
);

app.post(
  "/authentication/info",
  verifyAuthenticationScopeToken,
  verifyClientAuthentication,
  getAuthInfo
);

app.use(
  "/graf",
  verifyBasic,
  createHandler({
    schema,
  })
);

const prefix = envName === "dev" ? "http://" : "https://";
app.listen(port, () => {
  console.log(`Listening at ${prefix}${host}:${port}`);
});
