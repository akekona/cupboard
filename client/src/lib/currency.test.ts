import { describe, it, expect } from 'vitest'
import {
  CURRENCIES,
  CURRENCY_OPTIONS,
  formatCurrency,
  fromSmallestUnit,
  toSmallestUnit,
} from './currency'
import { formatCurrency as formatFromFormatters } from './formatters'

// ── CURRENCIES map ────────────────────────────────────────────────────────────

describe('CURRENCIES', () => {
  it('USD has subunitDivisor of 100', () => {
    expect(CURRENCIES.USD.subunitDivisor).toBe(100)
  })

  it('JPY has subunitDivisor of 1', () => {
    expect(CURRENCIES.JPY.subunitDivisor).toBe(1)
  })

  it('KRW has subunitDivisor of 1', () => {
    expect(CURRENCIES.KRW.subunitDivisor).toBe(1)
  })

  it('VND has subunitDivisor of 1', () => {
    expect(CURRENCIES.VND.subunitDivisor).toBe(1)
  })

  it('every currency has a non-empty symbol', () => {
    for (const [, val] of Object.entries(CURRENCIES)) {
      expect(val.symbol.length).toBeGreaterThan(0)
    }
  })

  it('every currency has a non-empty displayName', () => {
    for (const [, val] of Object.entries(CURRENCIES)) {
      expect(val.displayName.length).toBeGreaterThan(0)
    }
  })

  it('contains all 14 expected currencies', () => {
    const codes = Object.keys(CURRENCIES)
    expect(codes).toContain('USD')
    expect(codes).toContain('EUR')
    expect(codes).toContain('GBP')
    expect(codes).toContain('JPY')
    expect(codes).toContain('KRW')
    expect(codes).toContain('VND')
    expect(codes.length).toBe(14)
  })
})

// ── formatCurrency ────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('converts cents to USD display format', () => {
    expect(formatCurrency(2800, 'USD')).toBe('$28.00')
  })

  it('formats zero USD correctly', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })

  it('formats fractional USD correctly', () => {
    expect(formatCurrency(2850, 'USD')).toBe('$28.50')
  })

  it('formats JPY without decimal places', () => {
    expect(formatCurrency(500, 'JPY')).toBe('¥500')
  })

  it('formats KRW without decimal places', () => {
    expect(formatCurrency(10000, 'KRW')).toBe('₩10,000')
  })

  it('formats large USD amounts with commas', () => {
    expect(formatCurrency(120000, 'USD')).toBe('$1,200.00')
  })
})

// ── toSmallestUnit ────────────────────────────────────────────────────────────

describe('toSmallestUnit', () => {
  it('converts USD dollars to cents', () => {
    expect(toSmallestUnit(28, 'USD')).toBe(2800)
  })

  it('converts USD with decimals to cents', () => {
    expect(toSmallestUnit(28.5, 'USD')).toBe(2850)
  })

  it('rounds fractional cents', () => {
    expect(toSmallestUnit(28.999, 'USD')).toBe(2900)
  })

  it('JPY amount is unchanged', () => {
    expect(toSmallestUnit(500, 'JPY')).toBe(500)
  })

  it('handles zero', () => {
    expect(toSmallestUnit(0, 'USD')).toBe(0)
  })
})

// ── fromSmallestUnit ──────────────────────────────────────────────────────────

describe('fromSmallestUnit', () => {
  it('converts cents to USD dollars', () => {
    expect(fromSmallestUnit(2800, 'USD')).toBe(28)
  })

  it('converts odd cents to USD with decimals', () => {
    expect(fromSmallestUnit(2850, 'USD')).toBe(28.5)
  })

  it('JPY amount is unchanged', () => {
    expect(fromSmallestUnit(500, 'JPY')).toBe(500)
  })

  it('handles zero', () => {
    expect(fromSmallestUnit(0, 'USD')).toBe(0)
  })

  it('roundtrips with toSmallestUnit', () => {
    expect(fromSmallestUnit(toSmallestUnit(28.5, 'USD'), 'USD')).toBe(28.5)
  })
})

// ── CURRENCY_OPTIONS ──────────────────────────────────────────────────────────

describe('CURRENCY_OPTIONS', () => {
  it('has one entry per currency', () => {
    expect(CURRENCY_OPTIONS.length).toBe(Object.keys(CURRENCIES).length)
  })

  it('each option has a value and label', () => {
    for (const opt of CURRENCY_OPTIONS) {
      expect(opt.value).toBeTruthy()
      expect(opt.label).toContain(opt.value)
    }
  })

  it('USD option label contains display name', () => {
    const usd = CURRENCY_OPTIONS.find(o => o.value === 'USD')
    expect(usd?.label).toBe('USD — US Dollar')
  })
})

// ── formatters re-export ──────────────────────────────────────────────────────

describe('formatters', () => {
  it('re-exports formatCurrency with identical behaviour', () => {
    expect(formatFromFormatters(2800, 'USD')).toBe(formatCurrency(2800, 'USD'))
    expect(formatFromFormatters(500, 'JPY')).toBe(formatCurrency(500, 'JPY'))
  })
})
