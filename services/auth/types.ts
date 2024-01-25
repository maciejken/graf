import {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
} from "https://deno.land/x/simplewebauthn@v9.0.0/deno/types.ts";

export interface Credentials {
  id: string;
  salt: string;
  passwordHash: string;
  currentChallenge?: string;
  authenticatorIds?: string[];
}

export enum AuthType {
  Basic = "Basic",
  Bearer = "Bearer",
}

export interface Authenticator {
  credentialID: Uint8Array;
  credentialPublicKey: Uint8Array;
  credentialType: "public-key";
  credentialDeviceType: CredentialDeviceType;
  counter: number;
  credentialBackedUp: boolean;
  transports?: AuthenticatorTransportFuture[];
}
