import { privateKey, publicKey } from "./config.ts";
import { decrypt, encrypt } from "./services/secretService.ts";

const input =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6ImdlbmVyaWMiLCJpYXQiOjE3MTE3MTk3MzIsImV4cCI6MTc0MzI3NzMzMiwic3ViIjoiNWYzNDI4OGUtZTc1MC00NzUyLTg2ZTUtYmY1ZDhlMDk5ZTM2In0.d2LkVuMqQpeilB6FxSEI6Hj1kYQeBLIUnpovZdm8MWM";

let encrypted: string | undefined;
let decrypted: string | undefined;

if (publicKey && privateKey) {
  encrypted = await encrypt(input, publicKey);
  decrypted = await decrypt(encrypted, privateKey);
}

console.log("input data:", input);
console.log("encrypted data:", encrypted);
console.log("decrypted data:", decrypted);
console.log("success:", decrypted === input);
