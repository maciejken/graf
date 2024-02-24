// import { isoBase64URL } from "isoBase64URL";

import { privateKey } from "../config.ts";

// const algorithm = {
//   name: "RSA-OAEP",
//   modulusLength: 4096, // RSA key size
//   publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // RSA public exponent
//   hash: { name: "SHA-512" }, // Hash algorithm
// };

// const keyPair: CryptoKeyPair = await crypto.subtle.generateKey(
//   algorithm,
//   true,
//   ["encrypt", "decrypt"]
// );

// @TODO: store encrypted key in db, and salt/passphrase as env variable
export async function getPrivateKey() {
  // const buffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  // const bytes = new Uint8Array(buffer);
  // return `-----BEGIN PRIVATE KEY\n${isoBase64URL.fromBuffer(bytes)}\n-----END PRIVATE KEY-----\n`;
  return privateKey;
}
