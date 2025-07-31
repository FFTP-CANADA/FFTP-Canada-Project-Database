// Load exchange rate from localStorage or use default
const getStoredExchangeRate = (): number => {
  const stored = localStorage.getItem('exchangeRate');
  return stored ? parseFloat(stored) : 1.44;
};

let currentRate = getStoredExchangeRate();

export const USD_TO_CAD_RATE = currentRate;

export const setExchangeRate = (newRate: number): void => {
  currentRate = newRate;
  localStorage.setItem('exchangeRate', newRate.toString());
};

export const getExchangeRate = (): number => {
  return currentRate;
};

export const convertUsdToCad = (usdAmount: number): number => {
  return usdAmount * currentRate;
};

export const formatCurrency = (amount: number, currency: 'USD' | 'CAD'): string => {
  return `${currency} $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatWithExchange = (amount: number, originalCurrency: 'USD' | 'CAD'): string => {
  if (originalCurrency === 'USD') {
    const cadAmount = convertUsdToCad(amount);
    return `${formatCurrency(amount, 'USD')} (${formatCurrency(cadAmount, 'CAD')})`;
  }
  return formatCurrency(amount, 'CAD');
};

// Helper function to format currency without prefix
export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper function to format with currency prefix
export const formatAmountWithCurrency = (amount: number, prefix: string = '$'): string => {
  return `${prefix}${formatAmount(amount)}`;
};