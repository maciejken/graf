export const relyingPartyId = Deno.env.get("RELYING_PARTY_ID");
export const relyingPartyName = Deno.env.get("RELYING_PARTY_NAME");
export const expectedOrigin = Deno.env.get("EXPECTED_ORIGIN");

export function checkConfig() {
  const emptyValues: Array<{ key: string; value: string | undefined }> = [
    "RELYING_PARTY_ID",
    "RELYING_PARTY_NAME",
    "EXPECTED_ORIGIN",
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
