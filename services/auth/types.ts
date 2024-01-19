export interface Credentials {
  id: string;
  salt: string;
  passwordHash: string;
  currentChallenge?: string;
}

export enum AuthType {
  Basic = "Basic",
  Bearer = "Bearer",
}

export interface Authenticator {
  id: Uint8Array;
  publicKey: Uint8Array;
  counter: number;
  deviceType: DeviceType;
  isBackedUp: boolean;
  transports?: AuthenticatorTransport[];
}

type DeviceType = "singleDevice" | "multiDevice";
type AuthenticatorTransport = "usb" | "ble" | "nfc" | "internal";
