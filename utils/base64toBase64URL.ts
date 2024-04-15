export default function base64toBase64URL(s: string) {
  return s.replace(/\=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
