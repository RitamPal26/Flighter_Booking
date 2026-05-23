import { formatInTimeZone } from 'date-fns-tz'

export const formatTime = (isoString: string): string => {
  return formatInTimeZone(isoString, 'UTC', 'HH:mm')
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export const formatDate = (isoString: string): string => {
  return formatInTimeZone(isoString, 'UTC', 'MMM d, yyyy')
}