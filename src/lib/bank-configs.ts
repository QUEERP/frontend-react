/**
 * Statutory Bank Configuration, Field Specifications, and Validation Rules
 * Driven by config object (no hard-coded if/else chains in UI).
 */

export interface BankFieldDef {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  type?: 'text' | 'number';
  helperText?: string;
  validator?: (val: string) => boolean | string;
}

export interface CountryBankConfig {
  countryCode: string;
  countryName: string;
  currency: string;
  phoneCode: string;
  taxLabel: string;
  taxPlaceholder: string;
  taxValidator?: (val: string) => boolean | string;
  fields: BankFieldDef[];
}

/**
 * ISO 7064 Mod 97-10 IBAN Validation
 */
export function validateIbanMod97(iban: string): boolean {
  if (!iban) return false;
  const clean = String(iban).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 15 || clean.length > 34) return false;

  const rearranged = clean.slice(4) + clean.slice(0, 4);
  let numeric = '';
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      numeric += String(code - 55);
    } else {
      numeric += rearranged[i];
    }
  }

  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const chunk = String(remainder) + numeric.substring(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }

  return remainder === 1;
}

/**
 * US ABA Routing Transit Number Checksum Validation
 * Formula: (3*(d1+d4+d7) + 7*(d2+d5+d8) + 1*(d3+d6+d9)) % 10 === 0
 */
export function validateAbaRouting(routing: string): boolean {
  if (!routing) return false;
  const clean = String(routing).trim();
  if (!/^\d{9}$/.test(clean)) return false;

  const d = clean.split('').map(Number);
  const sum = (
    3 * (d[0] + d[3] + d[6]) +
    7 * (d[1] + d[4] + d[7]) +
    1 * (d[2] + d[5] + d[8])
  ) % 10;

  return sum === 0;
}

/**
 * SWIFT / BIC Code Validation (8 or 11 alphanumeric characters)
 */
export function validateSwiftBic(swift: string): boolean {
  if (!swift) return false;
  const clean = String(swift).trim().toUpperCase();
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(clean);
}

/**
 * Indian IFSC Code Validation
 */
export function validateIfscCode(ifsc: string): boolean {
  if (!ifsc) return false;
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(ifsc).trim().toUpperCase());
}

/**
 * Indian GSTIN Validation (15 chars)
 */
export function validateIndianGstin(gstin: string): boolean | string {
  if (!gstin) return true;
  const clean = String(gstin).trim().toUpperCase();
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean)) {
    return 'Invalid GSTIN format (e.g. 24AAAAA0000A1Z5)';
  }
  return true;
}

/**
 * UAE TRN Validation (15 digits starting with 100)
 */
export function validateUaeTrnNumber(trn: string): boolean | string {
  if (!trn) return true;
  const clean = String(trn).trim();
  if (!/^100\d{12}$/.test(clean) && !(/^\d{15}$/.test(clean) && clean.startsWith('100'))) {
    return 'Invalid UAE TRN (must be 15 digits starting with 100)';
  }
  return true;
}

export const BANK_CONFIGS: Record<string, CountryBankConfig> = {
  INDIA: {
    countryCode: 'IN',
    countryName: 'India',
    currency: 'INR',
    phoneCode: '+91',
    taxLabel: 'GSTIN',
    taxPlaceholder: '24AAAAA0000A1Z5',
    taxValidator: validateIndianGstin,
    fields: [
      { key: 'accountHolderName', label: 'Account Holder Name', placeholder: 'e.g. Acme India Ltd', required: true },
      { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. State Bank of India, HDFC', required: true },
      { 
        key: 'accountNumber', 
        label: 'Account Number (9-18 digits)', 
        placeholder: 'e.g. 123456789012', 
        required: true,
        validator: val => /^\d{9,18}$/.test(val) || 'Account number must be 9 to 18 digits'
      },
      { 
        key: 'ifsc', 
        label: 'IFSC Code', 
        placeholder: 'e.g. SBIN0001234', 
        required: true,
        validator: val => validateIfscCode(val) || 'Format: 4 letters, 0, 6 characters (e.g. SBIN0001234)'
      },
      { key: 'branchName', label: 'Branch Name', placeholder: 'e.g. Nariman Point, Mumbai', required: false },
      { key: 'upiId', label: 'UPI ID (Optional)', placeholder: 'e.g. company@okhdfcbank', required: false }
    ]
  },
  UAE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    currency: 'AED',
    phoneCode: '+971',
    taxLabel: 'TRN',
    taxPlaceholder: '100XXXXXXXXXXXX',
    taxValidator: validateUaeTrnNumber,
    fields: [
      { key: 'accountHolderName', label: 'Account Holder Name', placeholder: 'e.g. Al Futtaim Trading LLC', required: true },
      { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. Emirates NBD, ADCB', required: true },
      { 
        key: 'iban', 
        label: 'IBAN (23 chars)', 
        placeholder: 'AE070331234567890123456', 
        required: true,
        validator: val => {
          const clean = val.replace(/\s/g, '').toUpperCase();
          if (!clean.startsWith('AE') || clean.length !== 23) return 'Must start with AE and be 23 characters';
          if (!validateIbanMod97(clean)) return 'Invalid IBAN checksum (Mod-97 failed)';
          return true;
        }
      },
      { 
        key: 'swift', 
        label: 'SWIFT / BIC Code', 
        placeholder: 'e.g. EBILAEAD', 
        required: true,
        validator: val => validateSwiftBic(val) || 'Must be 8 or 11 alphanumeric characters'
      }
    ]
  },
  USA: {
    countryCode: 'US',
    countryName: 'United States',
    currency: 'USD',
    phoneCode: '+1',
    taxLabel: 'EIN / SSN',
    taxPlaceholder: 'XX-XXXXXXX',
    fields: [
      { key: 'accountHolderName', label: 'Account Holder Name', placeholder: 'e.g. John Doe Corp', required: true },
      { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. JPMorgan Chase, Bank of America', required: true },
      { 
        key: 'routingNumber', 
        label: 'Routing Number (ABA 9 digits)', 
        placeholder: 'e.g. 021000021', 
        required: true,
        validator: val => validateAbaRouting(val) || 'Invalid 9-digit ABA routing number checksum'
      },
      { 
        key: 'accountNumber', 
        label: 'Account Number', 
        placeholder: 'e.g. 123456789', 
        required: true,
        validator: val => /^\d{4,17}$/.test(val) || 'Account number must be 4 to 17 digits'
      },
      { 
        key: 'swift', 
        label: 'SWIFT / BIC (Optional for Domestic)', 
        placeholder: 'e.g. CHASUS33', 
        required: false,
        validator: val => !val || validateSwiftBic(val) || 'Must be 8 or 11 characters'
      }
    ]
  },
  UK: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    currency: 'GBP',
    phoneCode: '+44',
    taxLabel: 'VAT Number',
    taxPlaceholder: 'GB123456789',
    fields: [
      { key: 'accountHolderName', label: 'Account Holder Name', placeholder: 'e.g. British Trading Ltd', required: true },
      { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. Barclays, HSBC UK', required: true },
      { 
        key: 'sortCode', 
        label: 'Sort Code (6 digits)', 
        placeholder: 'e.g. 20-00-00 or 200000', 
        required: true,
        validator: val => /^\d{6}$/.test(val.replace(/[^0-9]/g, '')) || 'Sort code must be 6 digits'
      },
      { 
        key: 'accountNumber', 
        label: 'Account Number (8 digits)', 
        placeholder: 'e.g. 12345678', 
        required: true,
        validator: val => /^\d{8}$/.test(val.trim()) || 'Account number must be exactly 8 digits'
      },
      { 
        key: 'iban', 
        label: 'IBAN (Optional)', 
        placeholder: 'e.g. GB29NWBK60161331926819', 
        required: false,
        validator: val => !val || validateIbanMod97(val) || 'Invalid IBAN checksum'
      }
    ]
  },
  EU: {
    countryCode: 'EU',
    countryName: 'European Union / SEPA',
    currency: 'EUR',
    phoneCode: '+49',
    taxLabel: 'EU VAT ID',
    taxPlaceholder: 'DE123456789',
    fields: [
      { key: 'accountHolderName', label: 'Account Holder Name', placeholder: 'e.g. Euro Trade GmbH', required: true },
      { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. Deutsche Bank, BNP Paribas', required: true },
      { 
        key: 'iban', 
        label: 'IBAN', 
        placeholder: 'e.g. DE89370400440532013000', 
        required: true,
        validator: val => validateIbanMod97(val) || 'Invalid SEPA IBAN (Mod-97 failed)'
      },
      { 
        key: 'swift', 
        label: 'BIC / SWIFT', 
        placeholder: 'e.g. DEUTDEDBFXX', 
        required: true,
        validator: val => validateSwiftBic(val) || 'Must be 8 or 11 alphanumeric characters'
      }
    ]
  },
  CANADA: {
    countryCode: 'CA',
    countryName: 'Canada',
    currency: 'CAD',
    phoneCode: '+1',
    taxLabel: 'Business Number (BN / GST)',
    taxPlaceholder: '123456789RT0001',
    fields: [
      { key: 'accountHolderName', label: 'Account Holder Name', placeholder: 'e.g. Maple Leaf Enterprise', required: true },
      { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. RBC, TD Bank, Scotiabank', required: true },
      { 
        key: 'institutionNumber', 
        label: 'Institution Number (3 digits)', 
        placeholder: 'e.g. 003', 
        required: true,
        validator: val => /^\d{3}$/.test(val.trim()) || 'Must be 3 digits'
      },
      { 
        key: 'transitNumber', 
        label: 'Transit Number (5 digits)', 
        placeholder: 'e.g. 12345', 
        required: true,
        validator: val => /^\d{5}$/.test(val.trim()) || 'Must be 5 digits'
      },
      { 
        key: 'accountNumber', 
        label: 'Account Number (7-12 digits)', 
        placeholder: 'e.g. 1234567', 
        required: true,
        validator: val => /^\d{7,12}$/.test(val.trim()) || 'Must be 7 to 12 digits'
      }
    ]
  },
  AUSTRALIA: {
    countryCode: 'AU',
    countryName: 'Australia',
    currency: 'AUD',
    phoneCode: '+61',
    taxLabel: 'ABN',
    taxPlaceholder: '51 824 753 556',
    fields: [
      { key: 'accountHolderName', label: 'Account Holder Name', placeholder: 'e.g. Sydney Trading Pty Ltd', required: true },
      { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. Commonwealth Bank, ANZ', required: true },
      { 
        key: 'bsb', 
        label: 'BSB Number (6 digits)', 
        placeholder: 'e.g. 062-000 or 062000', 
        required: true,
        validator: val => /^\d{6}$/.test(val.replace(/[^0-9]/g, '')) || 'BSB must be 6 digits'
      },
      { 
        key: 'accountNumber', 
        label: 'Account Number (5-9 digits)', 
        placeholder: 'e.g. 12345678', 
        required: true,
        validator: val => /^\d{5,9}$/.test(val.trim()) || 'Must be 5 to 9 digits'
      }
    ]
  },
  OTHER: {
    countryCode: 'OTHER',
    countryName: 'Other / International',
    currency: 'USD',
    phoneCode: '+1',
    taxLabel: 'Tax ID / VAT Number',
    taxPlaceholder: 'Tax Registration Number',
    fields: [
      { key: 'accountHolderName', label: 'Account Holder Name', placeholder: 'Account Holder Name', required: true },
      { key: 'bankName', label: 'Bank Name', placeholder: 'Bank Name', required: true },
      { key: 'accountNumber', label: 'Account Number / IBAN', placeholder: 'Account Number or IBAN', required: true },
      { 
        key: 'swift', 
        label: 'SWIFT / BIC Code', 
        placeholder: 'SWIFT / BIC', 
        required: true,
        validator: val => validateSwiftBic(val) || 'Must be 8 or 11 characters'
      },
      { 
        key: 'iban', 
        label: 'IBAN (Optional)', 
        placeholder: 'IBAN if applicable', 
        required: false,
        validator: val => !val || validateIbanMod97(val) || 'Invalid IBAN checksum'
      }
    ]
  }
};

/**
 * 36 Indian States and Union Territories with statutory 2-digit GST codes
 */
export const INDIAN_GST_STATES = [
  { code: '01', name: 'Jammu and Kashmir', short: 'JK' },
  { code: '02', name: 'Himachal Pradesh', short: 'HP' },
  { code: '03', name: 'Punjab', short: 'PB' },
  { code: '04', name: 'Chandigarh', short: 'CH' },
  { code: '05', name: 'Uttarakhand', short: 'UK' },
  { code: '06', name: 'Haryana', short: 'HR' },
  { code: '07', name: 'Delhi', short: 'DL' },
  { code: '08', name: 'Rajasthan', short: 'RJ' },
  { code: '09', name: 'Uttar Pradesh', short: 'UP' },
  { code: '10', name: 'Bihar', short: 'BR' },
  { code: '11', name: 'Sikkim', short: 'SK' },
  { code: '12', name: 'Arunachal Pradesh', short: 'AR' },
  { code: '13', name: 'Nagaland', short: 'NL' },
  { code: '14', name: 'Manipur', short: 'MN' },
  { code: '15', name: 'Mizoram', short: 'MZ' },
  { code: '16', name: 'Tripura', short: 'TR' },
  { code: '17', name: 'Meghalaya', short: 'ML' },
  { code: '18', name: 'Assam', short: 'AS' },
  { code: '19', name: 'West Bengal', short: 'WB' },
  { code: '20', name: 'Jharkhand', short: 'JH' },
  { code: '21', name: 'Odisha', short: 'OD' },
  { code: '22', name: 'Chhattisgarh', short: 'CG' },
  { code: '23', name: 'Madhya Pradesh', short: 'MP' },
  { code: '24', name: 'Gujarat', short: 'GJ' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu', short: 'DNHDD' },
  { code: '27', name: 'Maharashtra', short: 'MH' },
  { code: '29', name: 'Karnataka', short: 'KA' },
  { code: '30', name: 'Goa', short: 'GA' },
  { code: '31', name: 'Lakshadweep', short: 'LD' },
  { code: '32', name: 'Kerala', short: 'KL' },
  { code: '33', name: 'Tamil Nadu', short: 'TN' },
  { code: '34', name: 'Puducherry', short: 'PY' },
  { code: '35', name: 'Andaman and Nicobar Islands', short: 'AN' },
  { code: '36', name: 'Telangana', short: 'TS' },
  { code: '37', name: 'Andhra Pradesh', short: 'AP' },
  { code: '38', name: 'Ladakh', short: 'LA' },
  { code: '97', name: 'Other Territory', short: 'OT' }
];

export function getBankConfigForCountry(countryNameOrCode: string): CountryBankConfig {
  if (!countryNameOrCode) return BANK_CONFIGS.INDIA;
  const c = String(countryNameOrCode).toUpperCase().trim();
  if (c === 'IN' || c === 'INDIA') return BANK_CONFIGS.INDIA;
  if (c === 'AE' || c === 'ARE' || c === 'UAE' || c.includes('EMIRATES')) return BANK_CONFIGS.UAE;
  if (c === 'US' || c === 'USA' || c.includes('UNITED STATES')) return BANK_CONFIGS.USA;
  if (c === 'GB' || c === 'UK' || c.includes('KINGDOM')) return BANK_CONFIGS.UK;
  if (c === 'CA' || c === 'CAN' || c === 'CANADA') return BANK_CONFIGS.CANADA;
  if (c === 'AU' || c === 'AUS' || c === 'AUSTRALIA') return BANK_CONFIGS.AUSTRALIA;
  if (['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'SE', 'NO', 'DK', 'FI', 'PT', 'IE', 'EUROPE', 'EU'].includes(c)) return BANK_CONFIGS.EU;
  return BANK_CONFIGS.OTHER;
}
