import { privateKey, publicKey } from "./config.ts";
import {
  arrayBufferToBase64String,
  decryptData,
  encryptData,
  importPrivateKey,
  importPublicKey,
} from "./services/secretService.ts";

const privateKeyBinary: CryptoKey = await importPrivateKey(privateKey!);
const publicKeyBinary: CryptoKey = await importPublicKey(publicKey!);

const encrypted = await encryptData(
  publicKeyBinary,
  encodeURIComponent("test :)")
);
const decrypted = await decryptData(privateKeyBinary, encrypted);
const decryptedBase64 = arrayBufferToBase64String(decrypted);

console.log("decrypted data:", decodeURIComponent(atob(decryptedBase64)));
