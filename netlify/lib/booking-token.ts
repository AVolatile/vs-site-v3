import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { runtimeValue } from "./runtime-env";
import { HttpError } from "./http";
export const bookingTokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function tokenFromNonce(nonce: string): string {
  const key = runtimeValue("BOOKING_TOKEN_SECRET");
  if (!/^[a-f\d]{64}$/i.test(key))
    throw new HttpError(
      503,
      "Configure a stable 32-byte hexadecimal BOOKING_TOKEN_SECRET in Netlify.",
    );
  return createHmac("sha256", Buffer.from(key, "hex"))
    .update(Buffer.from(nonce, "hex"))
    .digest("base64url");
}
export function createBookingToken() {
  const nonce = randomBytes(32).toString("hex"),
    token = tokenFromNonce(nonce);
  return { nonce, token, hash: bookingTokenHash(token) };
}
export function checkedToken(nonce: string, hash: string): string {
  const token = tokenFromNonce(nonce),
    actual = bookingTokenHash(token);
  if (!timingSafeEqual(Buffer.from(actual), Buffer.from(hash)))
    throw new HttpError(
      503,
      "The booking key changed. Restore the original key or explicitly regenerate this link.",
    );
  return token;
}
export const BOOKING_TOKEN_MARKER = "{{BOOKING_TOKEN}}";
