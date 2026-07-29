export const formatCurrency = (amount: number, currencyCode: string = 'INR', currencySymbol: string = '₹') => {
  if (amount === undefined || amount === null || isNaN(amount)) return `${currencySymbol} 0.00`;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  } catch (e) {
    // Fallback if Intl fails or currencyCode is invalid
    return `${currencySymbol} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};
