import { 
  addDays, 
  subDays, 
  subMonths, 
  subYears, 
  format, 
  differenceInDays, 
  isValid,
  startOfDay,
  endOfDay
} from 'date-fns'

/**
 * Calculate previous period of same duration
 * e.g. if current is Jan 1 - Jan 7 (7 days), previous is Dec 25 - Dec 31
 */
export function getPreviousPeriod(start: Date, end: Date): { start: Date; end: Date } {
  const durationInDays = differenceInDays(end, start) + 1
  const prevEnd = subDays(start, 1)
  const prevStart = subDays(prevEnd, durationInDays - 1)
  
  return {
    start: prevStart,
    end: prevEnd
  }
}

/**
 * Get same dates previous month
 * e.g. if current is Mar 10 - Mar 15, result is Feb 10 - Feb 15
 */
export function getSamePeriodLastMonth(start: Date, end: Date): { start: Date; end: Date } {
  return {
    start: subMonths(start, 1),
    end: subMonths(end, 1)
  }
}

/**
 * Get same dates previous year
 * e.g. if current is Mar 10 2024 - Mar 15 2024, result is Mar 10 2023 - Mar 15 2023
 */
export function getSamePeriodLastYear(start: Date, end: Date): { start: Date; end: Date } {
  return {
    start: subYears(start, 1),
    end: subYears(end, 1)
  }
}

/**
 * Validate date range selection
 */
export function validateDateRange(
  start: Date | undefined, 
  end: Date | undefined, 
  minDate?: Date, 
  maxDate?: Date
): { valid: boolean; error?: string } {
  if (!start) return { valid: false, error: 'Start date is required' }
  if (!end) return { valid: false, error: 'End date is required' }
  
  if (!isValid(start) || !isValid(end)) {
    return { valid: false, error: 'Invalid date selection' }
  }
  
  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' }
  }
  
  if (minDate && start < minDate) {
    return { valid: false, error: `Date cannot be before ${format(minDate, 'MMM d, yyyy')}` }
  }
  
  if (maxDate && end > maxDate) {
    return { valid: false, error: `Date cannot be after ${format(maxDate, 'MMM d, yyyy')}` }
  }
  
  return { valid: true }
}

/**
 * Convert date to Unix timestamp in milliseconds (for API)
 */
export function toUnixTimestamp(date: Date): number {
  return date.getTime()
}

/**
 * Format date range for user-friendly display
 */
export function formatDateRangeDisplay(start: Date, end: Date): string {
  if (!isValid(start) || !isValid(end)) return ''
  
  // If same year
  if (start.getFullYear() === end.getFullYear()) {
    // If same month
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`
    }
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  }
  
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
}

/**
 * Get start of day timestamp
 */
export function getStartOfDayTimestamp(date: Date): number {
  return startOfDay(date).getTime()
}

/**
 * Get end of day timestamp
 */
export function getEndOfDayTimestamp(date: Date): number {
  return endOfDay(date).getTime()
}
