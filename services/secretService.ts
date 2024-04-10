import { FromBerResult, fromBER } from "asn1js";
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

// const signAlgorithm = {
//   name: "RSASSA-PKCS1-v1_5",
//   hash: {
//     name: "SHA-256",
//   },
//   modulusLength: 2048,
//   extractable: false,
//   publicExponent: new Uint8Array([1, 0, 1]),
// };

const rsaOaepAlg = { name: "RSA-OAEP", hash: "SHA-256" };

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

export function convertBase64ToPem(line: string, label: string, del = "\n") {
  const lines: string[] = [];
  let index = 0;
  while (index < line.length) {
    lines.push(line.slice(index, index + 64));
    index += 64;
  }
  return `-----BEGIN ${label}-----${del}${lines.join(
    del
  )}${del}-----END ${label}-----`;
}

function convertBinaryToPem(privateKey: ArrayBuffer, label: string, del = "") {
  const bytes = new Uint8Array(privateKey);
  const b64 = arrayBufferToBase64String(bytes);
  return convertBase64ToPem(b64, label, del);
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

function b64tob64u(s: string) {
  return s.replace(/\=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  const privateKeyBinary = base64StringToArrayBuffer(pemKey);
  const privateKeySequence = fromBER(privateKeyBinary);
  const [
    _version,
    modulus,
    publicExponent,
    privateExponent,
    prime1,
    prime2,
    exponent1,
    exponent2,
    coefficient,
    // @ts-ignore privateKeySequence.valueBlock.value exists!
  ] = privateKeySequence.result.valueBlock.value;

  return crypto.subtle.importKey(
    "jwk",
    {
      kty: "RSA",
      n: b64tob64u(arrayBufferToBase64String(modulus.valueBlock.valueHex)),
      e: b64tob64u(
        arrayBufferToBase64String(publicExponent.valueBlock.valueHex)
      ),
      d: b64tob64u(
        arrayBufferToBase64String(privateExponent.valueBlock.valueHex)
      ),
      p: b64tob64u(arrayBufferToBase64String(prime1.valueBlock.valueHex)),
      q: b64tob64u(arrayBufferToBase64String(prime2.valueBlock.valueHex)),
      dp: b64tob64u(arrayBufferToBase64String(exponent1.valueBlock.valueHex)),
      dq: b64tob64u(arrayBufferToBase64String(exponent2.valueBlock.valueHex)),
      qi: b64tob64u(arrayBufferToBase64String(coefficient.valueBlock.valueHex)),
    },
    rsaOaepAlg,
    false,
    ["decrypt"]
  );
}

export async function exportPrivateKey(privateKey: CryptoKey) {
  const pkcs8: ArrayBuffer = await crypto.subtle.exportKey("pkcs8", privateKey);
  return convertBinaryToPem(pkcs8, "RSA PRIVATE KEY", "\n");
}

export function importPublicKey(pemKey: string): Promise<CryptoKey> {
  const publicKeyBinary = base64StringToArrayBuffer(pemKey);
  const publicKeySequence: FromBerResult = fromBER(publicKeyBinary);
  const modulus =
    // @ts-ignore result.valueBlock.value exists!
    publicKeySequence.result.valueBlock.value[0].valueBlock.valueHex;
  const exponent =
    // @ts-ignore result.valueBlock.value exists!
    publicKeySequence.result.valueBlock.value[1].valueBlock.valueHex;

  return crypto.subtle.importKey(
    "jwk",
    {
      kty: "RSA",
      e: b64tob64u(arrayBufferToBase64String(exponent)),
      n: b64tob64u(arrayBufferToBase64String(modulus)),
    },
    rsaOaepAlg,
    false,
    ["encrypt"]
  );
}

export async function exportPublicKey(publicKey: CryptoKey) {
  const spki: ArrayBuffer = await crypto.subtle.exportKey("spki", publicKey);
  return convertBinaryToPem(spki, "RSA PUBLIC KEY", "\n");
}

export function encryptData(data: string, key: CryptoKey) {
  return crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    key,
    textToArrayBuffer(data)
  );
}

export async function encrypt(data: string, publicKey: string) {
  const publicKeyBuffer = await importPublicKey(publicKey);
  const encryptedDataBuffer = await encryptData(data, publicKeyBuffer);
  return arrayBufferToBase64String(encryptedDataBuffer);
}

export function decryptData(
  data: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
      // iv: vector
    },
    key,
    data
  );
}

export async function decrypt(data: string, privateKey: string) {
  const dataBuffer: ArrayBuffer = base64StringToArrayBuffer(data);
  const privateKeyBuffer: CryptoKey = await importPrivateKey(privateKey);
  const decryptedBuffer: ArrayBuffer = await decryptData(
    dataBuffer,
    privateKeyBuffer
  );
  const decryptedBase64: string = arrayBufferToBase64String(decryptedBuffer);
  return decodeURIComponent(atob(decryptedBase64));
}

// @TODO: store encrypted key in db, and salt/passphrase as env variable
export async function getPrivateKey() {
  // const buffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  // const bytes = new Uint8Array(buffer);
  // return `-----BEGIN PRIVATE KEY\n${isoBase64URL.fromBuffer(bytes)}\n-----END PRIVATE KEY-----\n`;
  return privateKey;
}
