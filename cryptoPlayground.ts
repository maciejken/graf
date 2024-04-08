import { fromBER, FromBerResult } from "asn1js";
import { privateKey, publicKey } from "./config.ts";
import {
  arrayBufferToBase64String,
  base64StringToArrayBuffer,
  decrypt,
  decryptData,
  encrypt,
  encryptData,
} from "./services/secretService.ts";

function b64tob64u(s: string) {
  return s.replace(/\=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

const input =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6ImdlbmVyaWMiLCJpYXQiOjE3MTE3MTk3MzIsImV4cCI6MTc0MzI3NzMzMiwic3ViIjoiNWYzNDI4OGUtZTc1MC00NzUyLTg2ZTUtYmY1ZDhlMDk5ZTM2In0.d2LkVuMqQpeilB6FxSEI6Hj1kYQeBLIUnpovZdm8MWM";

let encrypted: string | undefined;
let decrypted: string | undefined;

if (publicKey && privateKey) {
  const publicKeyBinary = base64StringToArrayBuffer(publicKey);
  const publicKeySequence: FromBerResult = fromBER(publicKeyBinary);
  const modulus =
    publicKeySequence.result.valueBlock.value[0].valueBlock.valueHex;
  const modulusBase64 = b64tob64u(arrayBufferToBase64String(modulus));
  const exponent =
    publicKeySequence.result.valueBlock.value[1].valueBlock.valueHex;
  const exponentBase64 = b64tob64u(arrayBufferToBase64String(exponent));

  const privateKeyBinary = base64StringToArrayBuffer(privateKey);
  const privateKeySequence = fromBER(privateKeyBinary);
  const [
    version,
    _modulus,
    _publicExponent,
    privateExponent,
    prime1,
    prime2,
    exponent1,
    exponent2,
    coefficient,
  ] = privateKeySequence.result.valueBlock.value;

  const algo = { name: "RSA-OAEP", hash: "SHA-256" };

  const rsaPublicKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "RSA",
      e: exponentBase64,
      n: modulusBase64,
      alg: "RSA-OAEP-256",
      ext: true,
    },
    algo,
    false,
    ["encrypt"]
  );

  const rsaPrivateKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "RSA",
      n: modulusBase64,
      e: exponentBase64,
      d: b64tob64u(
        arrayBufferToBase64String(privateExponent.valueBlock.valueHex)
      ),
      p: b64tob64u(arrayBufferToBase64String(prime1.valueBlock.valueHex)),
      q: b64tob64u(arrayBufferToBase64String(prime2.valueBlock.valueHex)),
      dp: b64tob64u(arrayBufferToBase64String(exponent1.valueBlock.valueHex)),
      dq: b64tob64u(arrayBufferToBase64String(exponent2.valueBlock.valueHex)),
      qi: b64tob64u(arrayBufferToBase64String(coefficient.valueBlock.valueHex)),
    },
    algo,
    false,
    ["decrypt"]
  );

  encrypted = arrayBufferToBase64String(
    await encryptData(encodeURIComponent(input), rsaPublicKey)
  );

  const decryptedBase64 = arrayBufferToBase64String(
    await decryptData(base64StringToArrayBuffer(encrypted), rsaPrivateKey)
  );

  if (decryptedBase64) {
    decrypted = atob(decryptedBase64);
  }
}

console.log("input data:", input);
console.log("encrypted data:", encrypted);
console.log("decrypted data:", decrypted);
console.log("success:", decrypted === input);
