import { bookingTime, type PublicBooking } from "./contract";

export function timezoneLabel(
  timezone: string,
  instant = new Date().toISOString(),
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longGeneric",
  })
    .formatToParts(new Date(instant))
    .find((part) => part.type === "timeZoneName")!.value;
}

export function displayBookingDateTime(
  instant: string,
  timezone: string,
): string {
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(instant)) +
    " (" +
    timezoneLabel(timezone, instant) +
    ")"
  );
}

export const statusLabel = (status: PublicBooking["status"]) =>
  ({ scheduled: "Scheduled", cancelled: "Cancelled", completed: "Completed" })[
    status
  ];
export const meetingLabel = (type: PublicBooking["meetingType"]) =>
  type === "phone" ? "Phone call" : "Zoom call";

export function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith("1"))
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone;
}

export function renderBookingSummary(
  element: HTMLElement,
  booking: PublicBooking,
  timezone = booking.timezone,
) {
  const values: Record<string, string> = {
    date: new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(booking.startAt)),
    time:
      bookingTime(booking.startAt, timezone) +
      " – " +
      bookingTime(booking.endAt, timezone),
    zone: timezoneLabel(timezone, booking.startAt),
    meeting: meetingLabel(booking.meetingType),
    status: statusLabel(booking.status),
    client: booking.clientName,
  };
  for (const [key, value] of Object.entries(values))
    element.querySelector<HTMLElement>(
      "[data-summary-" + key + "]",
    )!.textContent = value;
  element.querySelector<HTMLElement>("[data-summary-status]")!.dataset.status =
    booking.status;
}

export function clearBookingSummary(element: HTMLElement) {
  element
    .querySelectorAll<HTMLElement>(
      "[data-summary-date],[data-summary-time],[data-summary-zone],[data-summary-meeting],[data-summary-status],[data-summary-client]",
    )
    .forEach((node) => {
      node.textContent = "";
      node.removeAttribute("data-status");
    });
}
