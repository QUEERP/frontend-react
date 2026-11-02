export interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
  category?: string;
}

export const ALL_CURRENCIES: CurrencyItem[] = [
  // Major & Most Used
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', category: 'Major Currencies' },
  { code: 'USD', name: 'US Dollar', symbol: '$', category: 'Major Currencies' },
  { code: 'EUR', name: 'Euro', symbol: '€', category: 'Major Currencies' },
  { code: 'GBP', name: 'British Pound', symbol: '£', category: 'Major Currencies' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', category: 'Middle East' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', category: 'Middle East' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', category: 'Middle East' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', category: 'Middle East' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', category: 'Middle East' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'RO', category: 'Middle East' },

  // Asia Pacific
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', category: 'Asia Pacific' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', category: 'Asia Pacific' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', category: 'Asia Pacific' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', category: 'Asia Pacific' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', category: 'Americas' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', category: 'Asia Pacific' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', category: 'Asia Pacific' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', category: 'Asia Pacific' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', category: 'Asia Pacific' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', category: 'Asia Pacific' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', category: 'Asia Pacific' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', category: 'Asia Pacific' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', category: 'Asia Pacific' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', category: 'Asia Pacific' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', category: 'Asia Pacific' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', category: 'Asia Pacific' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'रू', category: 'Asia Pacific' },

  // Europe & Americas
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', category: 'Europe' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', category: 'Europe' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', category: 'Europe' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', category: 'Europe' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', category: 'Europe' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', category: 'Europe' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', category: 'Europe' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', category: 'Americas' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', category: 'Americas' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', category: 'Americas' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', category: 'Americas' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', category: 'Americas' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/.', category: 'Americas' },

  // Africa
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', category: 'Africa' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', category: 'Africa' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', category: 'Africa' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', category: 'Africa' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', category: 'Africa' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', category: 'Africa' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', category: 'Africa' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD', category: 'Africa' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', category: 'Middle East' }
];

export function getCurrencySymbolFromCode(code: string): string {
  if (!code) return '$';
  const c = code.trim().toUpperCase();
  const match = ALL_CURRENCIES.find((item) => item.code === c);
  if (match) return match.symbol;
  if (c === 'INR') return '₹';
  if (c === 'EUR') return '€';
  if (c === 'GBP') return '£';
  if (c === 'AED') return 'د.إ';
  return '$';
}

