import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { runtimeValue } from "../runtime-env";
import { HttpError } from "../http";
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const randomToken = () => randomBytes(32).toString("base64url");
function key() {
  const value = runtimeValue("INTEGRATION_ENCRYPTION_KEY");
  if (!/^[a-fA-F0-9]{64}$/.test(value))
    throw new HttpError(
      503,
      "Configure the server integration encryption key.",
    );
  return Buffer.from(value, "hex");
}
export function encrypt(value: string, purpose: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(purpose));
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}
export function decrypt(value: string, purpose: string): string {
  try {
    const [version, iv, tag, data, ...extra] = value.split(".");
    if (version !== "v1" || extra.length || !iv || !tag || !data) throw Error();
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(),
      Buffer.from(iv, "base64url"),
    );
    decipher.setAAD(Buffer.from(purpose));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new HttpError(
      503,
      "Integration credentials could not be opened. Check the encryption key or reconnect.",
    );
  }
}
