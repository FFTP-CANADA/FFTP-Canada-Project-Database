// Timezone-safe date utilities to prevent date shifting issues

/**
 * Converts a Date object to YYYY-MM-DD string format without timezone conversion
 */
export const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts a YYYY-MM-DD string to Date object without timezone conversion
 */
export const fromDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formats a date string (YYYY-MM-DD) for display
 */
export const formatDateForDisplay = (dateString: string): string => {
  const date = fromDateString(dateString);
  return date.toLocaleDateString();
};

/**
 * Gets today's date as YYYY-MM-DD string without timezone issues
 */
export const getTodayString = (): string => {
  return toDateString(new Date());
};