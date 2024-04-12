import {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
} from "@simplewebauthn/types";

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

export interface Authenticator {
  credentialID: Uint8Array;
  credentialPublicKey: Uint8Array;
  credentialType: "public-key";
  credentialDeviceType: CredentialDeviceType;
  counter: number;
  credentialBackedUp: boolean;
  transports?: AuthenticatorTransportFuture[];
}
