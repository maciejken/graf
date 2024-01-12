import express from "npm:express@4";
import { createHandler } from "npm:graphql-http/lib/use/express";
import { schema } from "./schema/schema.ts";
import { ensureAuthenticated } from "./middleware/auth/index.ts";

const app = express();

app.use(
  "/graphql",
  ensureAuthenticated,
  createHandler({
    schema,
  })
);

app.listen(4000, () => {
  console.log("Listening...");
});
