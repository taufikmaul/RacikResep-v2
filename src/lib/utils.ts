import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface DecimalSettings {
  decimalPlaces: number
  roundingMethod: 'round' | 'floor' | 'ceil'
  thousandSeparator: string
  decimalSeparator: string
  currencySymbol: string
  currencyPosition: 'before' | 'after'
  showTrailingZeros: boolean
}

export function formatPrice(
  amount: number, 
  settings: DecimalSettings,
  options?: {
    showCurrency?: boolean
    showSeparators?: boolean
  }
): string {
  const {
    decimalPlaces,
    roundingMethod,
    thousandSeparator,
    decimalSeparator,
    currencySymbol,
    currencyPosition,
    showTrailingZeros
  } = settings

  const {
    showCurrency = true,
    showSeparators = true
  } = options || {}

  // Apply rounding
  let roundedAmount: number
  switch (roundingMethod) {
    case 'floor':
      roundedAmount = Math.floor(amount * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
      break
    case 'ceil':
      roundedAmount = Math.ceil(amount * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
      break
    default: // 'round'
      roundedAmount = Math.round(amount * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
  }

  // Format number with decimal places
  let formattedNumber = roundedAmount.toFixed(decimalPlaces)
  
  // Remove trailing zeros if not needed
  if (!showTrailingZeros) {
    formattedNumber = formattedNumber.replace(/\.?0+$/, '')
  }

  // Add thousand separators if enabled
  if (showSeparators && thousandSeparator) {
    const parts = formattedNumber.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator)
    formattedNumber = parts.join('.')
  }

  // Replace decimal point with custom separator
  if (decimalSeparator !== '.') {
    formattedNumber = formattedNumber.replace('.', decimalSeparator)
  }

  // Add currency symbol
  if (showCurrency && currencySymbol) {
    if (currencyPosition === 'before') {
      return `${currencySymbol}${formattedNumber}`
    } else {
      return `${formattedNumber}${currencySymbol}`
    }
  }

  return formattedNumber
}

// Helper function to format price without currency (for display purposes)
export function formatNumber(
  amount: number,
  settings: DecimalSettings
): string {
  return formatPrice(amount, settings, { showCurrency: false })
}

// Helper function to format price with currency
export function formatCurrency(
  amount: number,
  settings: DecimalSettings
): string {
  return formatPrice(amount, settings, { showCurrency: true })
}
