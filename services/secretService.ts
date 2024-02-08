const algorithm = {
  name: "RSA-OAEP",
  modulusLength: 4096, // RSA key size
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // RSA public exponent
  hash: { name: "SHA-512" }, // Hash algorithm
};

const keyPair: CryptoKeyPair = await crypto.subtle.generateKey(
  algorithm,
  true,
  ["encrypt", "decrypt"]
);

export async function getPublicKey(): Promise<ArrayBufferView> {
  const buffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  return new Uint8Array(buffer);
}

export async function getPrivateKey(): Promise<ArrayBufferView> {
  const buffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  return new Uint8Array(buffer);
}
