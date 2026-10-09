import company from "../../src/data/global/company.json";
import { runtimeValue } from "./runtime-env";
import { HttpError } from "./http";
function origin(value: string): string {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw Error();
    return url.origin;
  } catch {
    throw new HttpError(
      503,
      "Configure a valid HTTPS SITE_URL origin for the deployed website.",
    );
  }
}
export function publicUrl(path: string, asset = false): string {
  const site =
    runtimeValue("SITE_URL") ||
    runtimeValue("EMAIL_PUBLIC_URL") ||
    company.siteUrl;
  const base = origin(asset ? runtimeValue("EMAIL_PUBLIC_URL") || site : site);
  const url = new URL(path, base);
  if (!path.startsWith("/") || path.startsWith("//") || url.origin !== base)
    throw new HttpError(422, "Use an existing public website path.");
  return url.href;
}
