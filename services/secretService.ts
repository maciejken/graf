import { privateKey } from "../config.ts";

const encryptAlgorithm = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  extractable: true,
  hash: {
    name: "SHA-256",
  },
};

const signAlgorithm = {
  name: "RSASSA-PKCS1-v1_5",
  hash: {
    name: "SHA-256",
  },
  modulusLength: 2048,
  extractable: false,
  publicExponent: new Uint8Array([1, 0, 1]),
};

// const algorithm = {
//   name: "RSA-OAEP",
//   modulusLength: 4096, // RSA key size
//   publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // RSA public exponent
//   hash: { name: "SHA-512" }, // Hash algorithm
// };

export function arrayBufferToBase64String(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const chars: string[] = new Array(bytes.length);

  for (let i = 0; i < bytes.length; i++) {
    chars[i] = String.fromCharCode(bytes[i]);
  }

  return btoa(chars.join(""));
}

export function base64StringToArrayBuffer(base64String: string) {
  const codes: number[] = atob(base64String)
    .split("")
    .map((char) => char.charCodeAt(0));

  const bytes = new Uint8Array(codes.length);

  for (let i = 0; i < codes.length; i++) {
    bytes[i] = codes[i];
  }
  return bytes.buffer;
}

function textToArrayBuffer(text: string) {
  const buf = decodeURI(encodeURIComponent(text)); // 2 bytes for each char
  const bufView = new Uint8Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    bufView[i] = buf.charCodeAt(i);
  }
  return bufView;
}

function checkBase64(line: string) {
  return (
    line.trim().length > 0 &&
    line.indexOf("-BEGIN OPENSSH PRIVATE KEY-") < 0 &&
    line.indexOf("-END OPENSSH PRIVATE KEY-") < 0 &&
    line.indexOf("-BEGIN RSA PRIVATE KEY-") < 0 &&
    line.indexOf("-BEGIN RSA PUBLIC KEY-") < 0 &&
    line.indexOf("-END RSA PRIVATE KEY-") < 0 &&
    line.indexOf("-END RSA PUBLIC KEY-") < 0
  );
}

function convertPemToBinary(pem: string, del = "\n") {
  const lines = pem.split(del);
  let encoded = "";
  for (const line of lines) {
    const valid: boolean = checkBase64(line);
    if (valid) {
      encoded += line.trim();
    }
  }
  return base64StringToArrayBuffer(encoded);
}

function convertBinaryToPem(privateKey: ArrayBuffer, label: string, del = "") {
  const bytes = new Uint8Array(privateKey);
  const b64 = arrayBufferToBase64String(bytes);
  const lines: string[] = [];
  let index = 0;
  while (index < b64.length) {
    lines.push(b64.slice(index, index + 64));
    index += 64;
  }
  return `-----BEGIN ${label}-----${del}${lines.join(
    del
  )}${del}-----END ${label}-----`;
}

export function generateKey(
  alg: RsaHashedKeyGenParams | EcKeyGenParams,
  scope: KeyUsage[]
) {
  return crypto.subtle.generateKey(alg, true, scope);
}

export function generateSigningKey() {
  return generateKey(encryptAlgorithm, ["encrypt", "decrypt"]);
}

export function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    convertPemToBinary(pemKey),
    encryptAlgorithm,
    true,
    ["decrypt"]
  );
}

export async function exportPrivateKey(privateKey: CryptoKey) {
  const pkcs8: ArrayBuffer = await crypto.subtle.exportKey("pkcs8", privateKey);
  return convertBinaryToPem(pkcs8, "RSA PRIVATE KEY", "\n");
}

export function importPublicKey(pemKey: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    convertPemToBinary(pemKey),
    encryptAlgorithm,
    true,
    ["encrypt"]
  );
}

export async function exportPublicKey(publicKey: CryptoKey) {
  const spki: ArrayBuffer = await crypto.subtle.exportKey("spki", publicKey);
  return convertBinaryToPem(spki, "RSA PUBLIC KEY", "\n");
}

export function encryptData(key: CryptoKey, data: string) {
  return crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
      // iv: vector
    },
    key,
    textToArrayBuffer(data)
  );
}

export function decryptData(key: CryptoKey, data: ArrayBuffer) {
  return crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
      // iv: vector
    },
    key,
    data
  );
}

// @TODO: store encrypted key in db, and salt/passphrase as env variable
export async function getPrivateKey() {
  // const buffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  // const bytes = new Uint8Array(buffer);
  // return `-----BEGIN PRIVATE KEY\n${isoBase64URL.fromBuffer(bytes)}\n-----END PRIVATE KEY-----\n`;
  return privateKey;
}
