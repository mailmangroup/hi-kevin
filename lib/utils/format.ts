export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatPercent(value: number): string {
  return (value >= 0 ? '+' : '') + value.toFixed(1) + '%'
}

export function formatCurrency(amount: number, currency: string = '¥'): string {
  return currency + amount.toLocaleString()
}
