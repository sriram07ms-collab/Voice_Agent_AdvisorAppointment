import { format, parseISO, addDays, startOfDay, addHours, setHours, setMinutes } from 'date-fns';
import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

export function getISTDate(date?: Date): Date {
  const now = date || new Date();
  return utcToZonedTime(now, IST_TIMEZONE);
}

export function formatIST(date: Date, formatStr: string = 'PPPp'): string {
  return formatInTimeZone(date, IST_TIMEZONE, formatStr);
}

export function formatDateIST(date: Date): string {
  return formatIST(date, 'EEEE, MMMM d, yyyy');
}

export function formatTimeIST(date: Date): string {
  return formatIST(date, 'h:mm a');
}

export function formatDateTimeIST(date: Date): string {
  return formatIST(date, 'EEEE, MMMM d, yyyy h:mm a');
}

export function createISTDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  const date = new Date(year, month - 1, day, hour, minute);
  return zonedTimeToUtc(date, IST_TIMEZONE);
}

export function getNextBusinessDay(date: Date = new Date()): Date {
  let nextDay = addDays(date, 1);
  const istDate = getISTDate(nextDay);
  const dayOfWeek = istDate.getDay();
  
  // Skip weekends (Saturday = 6, Sunday = 0)
  if (dayOfWeek === 0) {
    nextDay = addDays(nextDay, 1);
  } else if (dayOfWeek === 6) {
    nextDay = addDays(nextDay, 2);
  }
  
  return nextDay;
}

export function isBusinessDay(date: Date): boolean {
  const istDate = getISTDate(date);
  const dayOfWeek = istDate.getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6; // Not Sunday or Saturday
}

// Re-export addDays from date-fns for convenience
export { addDays } from 'date-fns';




