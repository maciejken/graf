export const envName = Deno.env.get("ENV_NAME");
export const host = Deno.env.get("HOST");
export const port = Deno.env.get("PORT");
export const relyingPartyId = Deno.env.get("RELYING_PARTY_ID");
export const relyingPartyName = Deno.env.get("RELYING_PARTY_NAME");
export const expectedOrigin = Deno.env.get("EXPECTED_ORIGIN");
export const privateKey = Deno.env.get("PRIVATE_KEY");
export const registrationTokenExpiresIn = Deno.env.get(
  "REGISTRATION_TOKEN_EXPIRES_IN"
);
export const authenticationTokenExpiresIn = Deno.env.get(
  "AUTHENTICATION_TOKEN_EXPIRES_IN"
);
export const genericTokenExpiresIn = Deno.env.get("GENERIC_TOKEN_EXPIRES_IN");

export function checkConfig() {
  const emptyValues: Array<{ key: string; value: string | undefined }> = [
    "HOST",
    "PORT",
    "RELYING_PARTY_ID",
    "RELYING_PARTY_NAME",
    "EXPECTED_ORIGIN",
    "REGISTRATION_TOKEN_EXPIRES_IN",
    "AUTHENTICATION_TOKEN_EXPIRES_IN",
    "GENERIC_TOKEN_EXPIRES_IN",
    "PRIVATE_KEY"
  ]
    .map((key: string) => ({ key, value: Deno.env.get(key) }))
    .filter(({ value }) => !value);

  if (emptyValues.length) {
    const msg = `Some environment variables are undefined: ${emptyValues
      .map(({ key }) => key)
      .join(", ")}`;
    throw new Error(msg);
  }

  return true;
}
