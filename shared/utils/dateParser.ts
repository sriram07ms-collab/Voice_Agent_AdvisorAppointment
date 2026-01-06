import { parse, addDays, startOfToday, setHours, setMinutes, isAfter, isBefore } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Parse various date/time formats from user input
 * Supports formats like:
 * - "tomorrow 2pm"
 * - "Jan 6, 2pm"
 * - "January 6, 11am, 2026"
 * - "January 6, 2026, 2pm"
 * - "6 Jan 2pm"
 * - "next Monday 3pm"
 */
export function parseDateTimeInput(input: string): { date?: Date; time?: string } | null {
  if (!input || !input.trim()) {
    return null;
  }

  const lowerInput = input.toLowerCase().trim();
  const now = new Date();
  const istNow = utcToZonedTime(now, IST_TIMEZONE);
  const today = startOfToday();

  // Handle "tomorrow" or "tomorrow 2pm"
  if (lowerInput.startsWith('tomorrow')) {
    const tomorrow = addDays(today, 1);
    const timeMatch = lowerInput.match(/(\d{1,2})\s*(am|pm)/i);
    
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const period = timeMatch[2].toLowerCase();
      
      if (period === 'pm' && hour !== 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      
      const dateTime = setMinutes(setHours(tomorrow, hour), 0);
      return {
        date: zonedTimeToUtc(dateTime, IST_TIMEZONE),
        time: `${timeMatch[1]} ${timeMatch[2].toUpperCase()}`,
      };
    }
    
    return { date: zonedTimeToUtc(tomorrow, IST_TIMEZONE) };
  }

  // Handle "today" or "today 2pm"
  if (lowerInput.startsWith('today')) {
    const timeMatch = lowerInput.match(/(\d{1,2})\s*(am|pm)/i);
    
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const period = timeMatch[2].toLowerCase();
      
      if (period === 'pm' && hour !== 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      
      const dateTime = setMinutes(setHours(today, hour), 0);
      return {
        date: zonedTimeToUtc(dateTime, IST_TIMEZONE),
        time: `${timeMatch[1]} ${timeMatch[2].toUpperCase()}`,
      };
    }
    
    return { date: zonedTimeToUtc(today, IST_TIMEZONE) };
  }

  // Try to parse various date formats with time
  const patterns = [
    // "January 6, 11am, 2026" or "January 6, 2026, 11am"
    /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:,?\s+(\d{4}))?(?:,?\s+(\d{1,2})\s*(am|pm))?/i,
    // "6 January 2pm" or "6 Jan 2026 2pm"
    /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:\s+(\d{4}))?(?:\s+(\d{1,2})\s*(am|pm))?/i,
    // "Jan 6, 2pm" or "Jan 6, 2026, 2pm"
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:,?\s+(\d{4}))?(?:,?\s+(\d{1,2})\s*(am|pm))?/i,
  ];

  for (const pattern of patterns) {
    const match = lowerInput.match(pattern);
    if (match) {
      try {
        let monthStr = match[1];
        let dayStr = match[2];
        let yearStr = match[3] || new Date().getFullYear().toString();
        let hourStr = match[4];
        let period = match[5];

        // Convert month name to number
        const monthNames: { [key: string]: number } = {
          'january': 1, 'jan': 1,
          'february': 2, 'feb': 2,
          'march': 3, 'mar': 3,
          'april': 4, 'apr': 4,
          'may': 5,
          'june': 6, 'jun': 6,
          'july': 7, 'jul': 7,
          'august': 8, 'aug': 8,
          'september': 9, 'sep': 9,
          'october': 10, 'oct': 10,
          'november': 11, 'nov': 11,
          'december': 12, 'dec': 12,
        };

        const month = monthNames[monthStr.toLowerCase()];
        const day = parseInt(dayStr);
        const year = parseInt(yearStr);

        if (month && day && year) {
          let hour = hourStr ? parseInt(hourStr) : undefined;
          if (hour && period) {
            if (period === 'pm' && hour !== 12) hour += 12;
            if (period === 'am' && hour === 12) hour = 0;
          }

          const date = new Date(year, month - 1, day);
          if (hour !== undefined) {
            const dateTime = setMinutes(setHours(date, hour), 0);
            return {
              date: zonedTimeToUtc(dateTime, IST_TIMEZONE),
              time: hourStr ? `${hourStr} ${period?.toUpperCase() || ''}` : undefined,
            };
          }

          return {
            date: zonedTimeToUtc(date, IST_TIMEZONE),
          };
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }

  // Try using date-fns parse for standard formats
  const parseFormats = [
    'MMMM d, yyyy h:mm a',
    'MMMM d, yyyy',
    'MMM d, yyyy h:mm a',
    'MMM d, yyyy',
    'd MMMM yyyy h:mm a',
    'd MMM yyyy h:mm a',
  ];

  for (const format of parseFormats) {
    try {
      const parsed = parse(input, format, now);
      if (parsed && !isNaN(parsed.getTime())) {
        return {
          date: zonedTimeToUtc(parsed, IST_TIMEZONE),
          time: format.includes('h:mm a') ? input.match(/\d{1,2}\s*(am|pm)/i)?.[0] : undefined,
        };
      }
    } catch (e) {
      // Continue
    }
  }

  return null;
}



