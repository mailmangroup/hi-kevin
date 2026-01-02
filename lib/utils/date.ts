import { format, formatDistanceToNow as fnsFormatDistanceToNow, isToday, isYesterday } from 'date-fns'

export const formatDistanceToNow = fnsFormatDistanceToNow

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy HH:mm')
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (isToday(d)) {
    return 'Today'
  }
  if (isYesterday(d)) {
    return 'Yesterday'
  }

  return formatDistanceToNow(d, { addSuffix: true })
}
