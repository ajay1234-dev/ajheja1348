import { format, formatDistanceToNow } from "date-fns";

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

type DateValue = FirestoreTimestamp | string | Date | null | undefined;

/**
 * Safely formats a date value that might come from Firebase Firestore
 * Handles Firestore Timestamps, ISO strings, and Date objects
 */
export function safeFormatDate(
  dateValue: DateValue,
  formatString: string = "MMM d, yyyy"
): string {
  if (!dateValue) return "Not available";

  try {
    let date: Date;

    // Handle Firestore Timestamp objects (with seconds and nanoseconds)
    if (dateValue && typeof dateValue === "object" && "seconds" in dateValue) {
      date = new Date((dateValue as FirestoreTimestamp).seconds * 1000);
    } else {
      // Handle ISO date strings and Date objects
      date = new Date(dateValue as string | Date);
    }

    if (isNaN(date.getTime())) {
      return "Not available";
    }

    return format(date, formatString);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Not available";
  }
}

/**
 * Formats a date to show relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateValue: DateValue): string {
  if (!dateValue) return "Not available";

  try {
    let date: Date;

    // Handle Firestore Timestamp objects (with seconds and nanoseconds)
    if (dateValue && typeof dateValue === "object" && "seconds" in dateValue) {
      date = new Date((dateValue as FirestoreTimestamp).seconds * 1000);
    } else {
      // Handle ISO date strings and Date objects
      date = new Date(dateValue as string | Date);
    }

    if (isNaN(date.getTime())) {
      return "Not available";
    }

    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Relative time formatting error:", error);
    return "Not available";
  }
}