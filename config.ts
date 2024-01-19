export const publicRsaKey = Deno.env.get("RSA_PUBLIC_KEY");
export const privateRsaKey = Deno.env.get("RSA_PRIVATE_KEY");
export const u2fAppId = Deno.env.get("U2F_APP_ID");
export const u2fVersion = Deno.env.get("U2F_VERSION") || "U2F_V2";
