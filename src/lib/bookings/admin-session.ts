import { getUser, logout, onAuthChange } from "@netlify/identity";
export function calendarReturnUrl(value: string | null): string | null {
  try {
    const u = new URL(value ?? "", "https://internal.invalid");
    if (
      u.origin !== "https://internal.invalid" ||
      !["/admin/calendar/", "/admin/calendar/settings/"].includes(u.pathname)
    )
      return null;
    return u.pathname + u.search;
  } catch {
    return null;
  }
}
export async function setupBookingAdmin(clear: () => void) {
  let user: Awaited<ReturnType<typeof getUser>>;
  try {
    user = await getUser();
  } catch {
    clear();
    location.replace("/admin/login/");
    return null;
  }
  if (!user?.roles?.includes("admin")) {
    clear();
    location.replace(
      "/admin/login/?returnTo=" +
        encodeURIComponent(location.pathname + location.search),
    );
    return null;
  }
  let active = true;
  onAuthChange((event) => {
    if (event === "logout") {
      active = false;
      clear();
      location.replace("/admin/login/");
    }
  });
  document
    .querySelector<HTMLButtonElement>("[data-calendar-logout]")
    ?.addEventListener("click", () => {
      void logout();
    });
  return {
    active: () => active,
    request: async <T>(url: string, options: RequestInit = {}): Promise<T> => {
      const response = await fetch(url, {
        ...options,
        credentials: "same-origin",
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      const body = await response.json();
      if (response.status === 401 || response.status === 403) {
        active = false;
        clear();
        location.replace(
          "/admin/login/?returnTo=" +
            encodeURIComponent(location.pathname + location.search),
        );
        throw Error("Sign in again to continue.");
      }
      if (!response.ok)
        throw Error(
          typeof body.error === "string"
            ? body.error
            : "The calendar request could not be completed.",
        );
      return body as T;
    },
  };
}
