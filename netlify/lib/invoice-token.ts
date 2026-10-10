import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { runtimeValue } from "./runtime-env";
import { HttpError } from "./http";
export const INVOICE_TOKEN_MARKER = "{{INVOICE_TOKEN}}";
export const invoiceTokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function invoiceToken(id: string, createdAt: string) {
  const key = runtimeValue("INVOICE_TOKEN_SECRET");
  if (!/^[a-f\d]{64}$/i.test(key))
    throw new HttpError(
      503,
      "Configure a stable 32-byte hexadecimal INVOICE_TOKEN_SECRET in Netlify.",
    );
  // Purpose-bound HMAC yields a 256-bit bearer token; only hash/time/UUID are persisted.
  return createHmac("sha256", Buffer.from(key, "hex"))
    .update(
      "invoice:v1:" +
        id.toLowerCase() +
        ":" +
        new Date(createdAt).toISOString(),
    )
    .digest("base64url");
}
export function checkedInvoiceToken(
  id: string,
  createdAt: string,
  hash: string,
) {
  const token = invoiceToken(id, createdAt),
    actual = invoiceTokenHash(token);
  if (
    !/^[a-f\d]{64}$/.test(hash) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(hash))
  )
    throw new HttpError(
      503,
      "The invoice key changed. Restore the original key before sharing invoice links.",
    );
  return token;
}
