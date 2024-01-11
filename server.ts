import express from "npm:express@4";
import { createHandler } from "npm:graphql-http/lib/use/express";
import { schema } from "./schema/schema.ts";

const app = express();

app.use(
  "/graphql",
  createHandler({
    schema,
  })
);

app.listen(4000, () => {
  console.log("Listening...");
});
