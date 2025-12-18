/**
 * Format monetary amounts according to WestBudget standards:
 * - Positive amounts: "1 700 kr" (space as thousand separator, "kr" suffix, green text)
 * - Negative amounts: "-1 700 kr" (space as thousand separator, "kr" suffix, red text)
 */

export const formatAmount = (value) => {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  
  if (isNaN(numValue)) return '';
  
  // Both positive and negative: use space as thousand separator and "kr" suffix
  const formatted = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.abs(numValue));
  
  return numValue < 0 ? `-${formatted} kr` : `${formatted} kr`;
};

/**
 * Get the appropriate className for amount display based on sign
 */
export const getAmountClassName = (value) => {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  
  if (isNaN(numValue)) return 'text-zinc-900 dark:text-zinc-300';
  
  if (numValue < 0) {
    // Negative: red text
    return 'text-rose-500 dark:text-rose-400';
  } else {
    // Positive: green text
    return 'text-emerald-500 dark:text-emerald-400';
  }
};

/**
 * Format amount with sign prefix for display
 * Used when we need to show the sign explicitly
 */
export const formatAmountWithSign = (value) => {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  
  if (isNaN(numValue)) return '';
  
  // Both positive and negative: use space as thousand separator and "kr" suffix
  const formatted = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.abs(numValue));
  
  return numValue < 0 ? `-${formatted} kr` : `${formatted} kr`;
};

