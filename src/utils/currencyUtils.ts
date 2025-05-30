
let currentRate = 1.44;

export const USD_TO_CAD_RATE = currentRate;

export const setExchangeRate = (newRate: number): void => {
  currentRate = newRate;
};

export const getExchangeRate = (): number => {
  return currentRate;
};

export const convertUsdToCad = (usdAmount: number): number => {
  return usdAmount * currentRate;
};

export const formatCurrency = (amount: number, currency: 'USD' | 'CAD'): string => {
  return `${currency} $${amount.toLocaleString()}`;
};

export const formatWithExchange = (amount: number, originalCurrency: 'USD' | 'CAD'): string => {
  if (originalCurrency === 'USD') {
    const cadAmount = convertUsdToCad(amount);
    return `${formatCurrency(amount, 'USD')} (${formatCurrency(cadAmount, 'CAD')})`;
  }
  return formatCurrency(amount, 'CAD');
};
