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

export enum AuthScope {
  Registration = "registration",
  Authentication = "authentication",
  Generic = "generic",
}

export interface Authenticator<T = Uint8Array> {
  credentialID: T;
  credentialPublicKey: T;
  credentialType: "public-key";
  credentialDeviceType: CredentialDeviceType;
  counter: number;
  credentialBackedUp: boolean;
  transports?: AuthenticatorTransportFuture[];
}
