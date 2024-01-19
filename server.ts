import express from "npm:express@4";
import { createHandler } from "npm:graphql-http/lib/use/express";
import { schema } from "./gql/schema.ts";
import { verifyCredentials } from "./middleware/verifyCredentials.ts";
import { createAuthenticator, createUser } from "./controllers/register.ts";

const app = express();

app.use(express.json());

app.post("/register/user", createUser);

app.post("/register/authenticator", createAuthenticator);

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
