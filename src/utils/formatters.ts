export const formatTime = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}