// EST timezone-aware date utilities
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

const EST_TIMEZONE = 'America/New_York';

/**
 * Gets the current date and time in EST timezone
 */
export const getCurrentESTDate = (): Date => {
  return toZonedTime(new Date(), EST_TIMEZONE);
};

/**
 * Converts any Date to EST timezone
 */
export const toESTDate = (date: Date): Date => {
  return toZonedTime(date, EST_TIMEZONE);
};

/**
 * Converts a Date object to YYYY-MM-DD string format in EST timezone
 */
export const toDateString = (date: Date): string => {
  const estDate = toESTDate(date);
  const year = estDate.getFullYear();
  const month = String(estDate.getMonth() + 1).padStart(2, '0');
  const day = String(estDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts a YYYY-MM-DD string to Date object in EST timezone
 */
export const fromDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  return fromZonedTime(localDate, EST_TIMEZONE);
};

/**
 * Formats a date string (YYYY-MM-DD) for display in EST timezone
 */
export const formatDateForDisplay = (dateString: string): string => {
  const date = fromDateString(dateString);
  return formatInTimeZone(date, EST_TIMEZONE, 'PPP');
};

/**
 * Gets today's date as YYYY-MM-DD string in EST timezone
 */
export const getTodayString = (): string => {
  return toDateString(getCurrentESTDate());
};

/**
 * Gets current timestamp in EST timezone as ISO string
 */
export const getCurrentESTTimestamp = (): string => {
  return formatInTimeZone(new Date(), EST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

/**
 * Converts ISO timestamp to EST timezone
 */
export const toESTTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return formatInTimeZone(date, EST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

/**
 * Formats timestamp for display in EST timezone
 */
export const formatTimestampForDisplay = (timestamp: string): string => {
  const date = new Date(timestamp);
  return formatInTimeZone(date, EST_TIMEZONE, 'PPpp');
};