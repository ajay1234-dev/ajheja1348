import { format } from 'date-fns';

/**
 * Safely formats a date value that might come from Firebase Firestore
 * Handles Firestore Timestamps, ISO strings, and Date objects
 */
export function safeFormatDate(dateValue: any, formatString: string = 'MMM d, yyyy'): string {
  if (!dateValue) return 'N/A';
  
  try {
    // Handle Firestore Timestamp objects (with seconds and nanoseconds)
    if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      return format(new Date(dateValue.seconds * 1000), formatString);
    }
    
    // Handle ISO date strings and Date objects
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'N/A';
  }
}
