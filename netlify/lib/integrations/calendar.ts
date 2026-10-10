// Booking orchestration depends on this boundary; Graph requests stay in its adapter.
import { outlookCalendarProvider } from "./outlook-calendar";
export const calendarProvider = outlookCalendarProvider;
