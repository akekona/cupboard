export const CURRENCIES = {
  USD: { displayName: 'US Dollar',          subunitDivisor: 100, symbol: '$'   },
  EUR: { displayName: 'Euro',               subunitDivisor: 100, symbol: '€'   },
  GBP: { displayName: 'British Pound',      subunitDivisor: 100, symbol: '£'   },
  JPY: { displayName: 'Japanese Yen',       subunitDivisor: 1,   symbol: '¥'   },
  KRW: { displayName: 'South Korean Won',   subunitDivisor: 1,   symbol: '₩'   },
  VND: { displayName: 'Vietnamese Dong',    subunitDivisor: 1,   symbol: '₫'   },
  CAD: { displayName: 'Canadian Dollar',    subunitDivisor: 100, symbol: 'CA$' },
  AUD: { displayName: 'Australian Dollar',  subunitDivisor: 100, symbol: 'A$'  },
  NZD: { displayName: 'New Zealand Dollar', subunitDivisor: 100, symbol: 'NZ$' },
  HKD: { displayName: 'Hong Kong Dollar',   subunitDivisor: 100, symbol: 'HK$' },
  SGD: { displayName: 'Singapore Dollar',   subunitDivisor: 100, symbol: 'S$'  },
  PHP: { displayName: 'Philippine Peso',    subunitDivisor: 100, symbol: '₱'   },
  THB: { displayName: 'Thai Baht',          subunitDivisor: 100, symbol: '฿'   },
  CNY: { displayName: 'Chinese Yuan',       subunitDivisor: 100, symbol: '¥'   },
} as const

export type CurrencyCode = keyof typeof CURRENCIES

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const { subunitDivisor } = CURRENCIES[currency]
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / subunitDivisor)
}

export function toSmallestUnit(amount: number, currency: CurrencyCode): number {
  return Math.round(amount * CURRENCIES[currency].subunitDivisor)
}

export function fromSmallestUnit(amount: number, currency: CurrencyCode): number {
  return amount / CURRENCIES[currency].subunitDivisor
}

export const CURRENCY_OPTIONS = Object.entries(CURRENCIES).map(([code, val]) => ({
  value: code as CurrencyCode,
  label: `${code} — ${val.displayName}`,
}))
