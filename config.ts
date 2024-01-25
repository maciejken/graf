export const relyingPartyId = Deno.env.get("RELYING_PARTY_ID") || "localhost";
export const relyingPartyName = Deno.env.get("RELYING_PARTY_NAME") || "Graf";
export const expectedOrigin =
  Deno.env.get("EXPECTED_ORIGIN") || "http://localhost:8000";
