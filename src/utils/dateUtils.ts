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
  if (!dateString || typeof dateString !== 'string') {
    console.warn('Invalid dateString provided to fromDateString:', dateString);
    return new Date(); // Return current date as fallback
  }

  const parts = dateString.split('-');
  if (parts.length !== 3) {
    console.warn('Invalid date format in fromDateString:', dateString);
    return new Date(); // Return current date as fallback
  }

  const [year, month, day] = parts.map(Number);
  
  // Validate the numbers
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    console.warn('Invalid date components in fromDateString:', { year, month, day, original: dateString });
    return new Date(); // Return current date as fallback
  }

  // Validate ranges
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    console.warn('Invalid date values in fromDateString:', { year, month, day, original: dateString });
    return new Date(); // Return current date as fallback
  }

  const localDate = new Date(year, month - 1, day);
  
  // Check if the created date is valid
  if (isNaN(localDate.getTime())) {
    console.warn('Created invalid Date in fromDateString:', { year, month, day, original: dateString });
    return new Date(); // Return current date as fallback
  }

  try {
    return fromZonedTime(localDate, EST_TIMEZONE);
  } catch (error) {
    console.warn('Error in fromZonedTime:', error, 'for date:', dateString);
    return new Date(); // Return current date as fallback
  }
};

/**
 * Formats a date string (YYYY-MM-DD) for display in EST timezone
 */
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString || typeof dateString !== 'string') {
    return 'Invalid Date';
  }

  try {
    const date = fromDateString(dateString);
    return formatInTimeZone(date, EST_TIMEZONE, 'PPP');
  } catch (error) {
    console.warn('Error formatting date for display:', error, 'for dateString:', dateString);
    return 'Invalid Date';
  }
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
  if (!timestamp || typeof timestamp !== 'string') {
    console.warn('Invalid timestamp provided to toESTTimestamp:', timestamp);
    return getCurrentESTTimestamp(); // Return current timestamp as fallback
  }

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp created Date in toESTTimestamp:', timestamp);
      return getCurrentESTTimestamp(); // Return current timestamp as fallback
    }
    return formatInTimeZone(date, EST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
  } catch (error) {
    console.warn('Error in toESTTimestamp:', error, 'for timestamp:', timestamp);
    return getCurrentESTTimestamp(); // Return current timestamp as fallback
  }
};

/**
 * Formats timestamp for display in EST timezone
 */
export const formatTimestampForDisplay = (timestamp: string): string => {
  if (!timestamp || typeof timestamp !== 'string') {
    return 'Invalid Date';
  }

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp for display:', timestamp);
      return 'Invalid Date';
    }
    return formatInTimeZone(date, EST_TIMEZONE, 'PPpp');
  } catch (error) {
    console.warn('Error formatting timestamp for display:', error, 'for timestamp:', timestamp);
    return 'Invalid Date';
  }
};