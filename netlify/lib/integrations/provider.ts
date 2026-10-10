export type ErrorCode =
  | "configuration"
  | "reconnect_required"
  | "rate_limited"
  | "provider_unavailable"
  | "provider_rejected"
  | "invalid_response"
  | "not_found"
  | "gone"
  | "conflict"
  | "sync_unconfirmed"
  | "account_changed"
  | "calendar_missing";
export class ProviderError extends Error {
  constructor(
    public code: ErrorCode,
    public status = 0,
  ) {
    super(code);
  }
}
export const errorCode = (error: unknown): ErrorCode =>
  error instanceof ProviderError ? error.code : "provider_unavailable";
export const providerMessages: Record<ErrorCode, string> = {
  configuration: "Configure the provider credentials in Netlify.",
  reconnect_required: "Reconnect Outlook Calendar to restore access.",
  rate_limited: "The provider is limiting requests. Retry shortly.",
  provider_unavailable: "The provider is temporarily unavailable. Retry sync.",
  provider_rejected:
    "The provider rejected the request. Check account permissions.",
  invalid_response:
    "The provider response could not be verified. Retry reconciliation.",
  not_found: "The external item is missing. Retry reconciliation.",
  gone: "The external item was deleted. Retry reconciliation.",
  conflict: "The external item could not be verified. Retry reconciliation.",
  sync_unconfirmed:
    "External creation is unconfirmed. Retry looks for the existing item without creating another. Review the provider if it remains unresolved.",
  account_changed:
    "This item belongs to the previous provider account or host. Restore that account before retrying.",
  calendar_missing: "Select a writable Outlook Calendar.",
};
export function safeMessage(code: string | null) {
  return code && code in providerMessages
    ? providerMessages[code as ErrorCode]
    : null;
}
// Only retry operations known to be idempotent. Zoom meeting POST deliberately opts out.
export async function providerRequest(
  url: string,
  init: RequestInit = {},
  retry = true,
  deadline?: AbortSignal,
): Promise<unknown> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        redirect: "error",
        signal: AbortSignal.any([
          AbortSignal.timeout(3500),
          ...(deadline ? [deadline] : []),
        ]),
      });
    } catch {
      if (retry && !attempt && !deadline?.aborted) continue;
      throw new ProviderError("provider_unavailable");
    }
    if (
      retry &&
      !attempt &&
      (response.status === 429 || response.status >= 500) &&
      !deadline?.aborted
    ) {
      const wait = Number(response.headers.get("retry-after") || "0");
      if (Number.isFinite(wait) && wait > 0 && wait <= 1)
        await new Promise((r) => setTimeout(r, wait * 1000));
      else if (wait > 1) throw new ProviderError("rate_limited", 429);
      continue;
    }
    if (!response.ok)
      throw new ProviderError(
        response.status === 401
          ? "reconnect_required"
          : response.status === 404
            ? "not_found"
            : response.status === 410
              ? "gone"
              : response.status === 409
                ? "conflict"
                : response.status === 429
                  ? "rate_limited"
                  : response.status >= 500
                    ? "provider_unavailable"
                    : "provider_rejected",
        response.status,
      );
    if (response.status === 204) return null;
    try {
      return await response.json();
    } catch {
      throw new ProviderError("invalid_response");
    }
  }
  throw new ProviderError("provider_unavailable");
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ProviderError("invalid_response");
  return value as Record<string, unknown>;
}
export function text(value: unknown, max = 2048): string {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > max ||
    /[\u0000-\u001f\u007f]/.test(value)
  )
    throw new ProviderError("invalid_response");
  return value;
}
export function timestamp(value: unknown): string {
  const s = text(value);
  if (!Number.isFinite(Date.parse(s)))
    throw new ProviderError("invalid_response");
  return new Date(s).toISOString();
}
export const iso = (value: unknown) => new Date(String(value)).toISOString();
