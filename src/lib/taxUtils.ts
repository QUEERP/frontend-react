import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface DateRangePreset {
  id: string;
  label: string;
  getRange: () => { from: Date; to: Date };
}

/**
 * Indian Standard Currency Formatter
 * Uses en-IN formatting (lakhs, crores) with two fixed decimals.
 */
export function formatTaxCurrency(amount: number | undefined | null, currency = 'INR'): string {
  const val = Number(amount || 0);
  try {
    const isINR = currency?.toUpperCase() === 'INR';
    const formatter = new Intl.NumberFormat(isINR ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(val);
  } catch (e) {
    return `${currency} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Format Indian Financial Year bounds
 * India FY runs from April 1 to March 31.
 */
export function getIndianFinancialYear(d: Date = new Date()): { from: Date; to: Date; label: string } {
  const currentYear = d.getFullYear();
  const currentMonth = d.getMonth(); // 0 = Jan, 3 = Apr

  let fyStartYear = currentYear;
  if (currentMonth < 3) {
    // Jan, Feb, Mar belong to previous calendar year's FY
    fyStartYear = currentYear - 1;
  }
  const fyEndYear = fyStartYear + 1;

  const from = new Date(fyStartYear, 3, 1, 0, 0, 0, 0); // 1st April
  const to = new Date(fyEndYear, 2, 31, 23, 59, 59, 999); // 31st March

  return {
    from,
    to,
    label: `FY ${fyStartYear}-${String(fyEndYear).slice(2)} (${format(from, 'dd MMM yyyy')} - ${format(to, 'dd MMM yyyy')})`
  };
}

/**
 * Standard GST Report Presets
 */
export function getGstPeriodPresets(): DateRangePreset[] {
  const now = new Date();
  
  return [
    {
      id: 'this-month',
      label: 'This Month',
      getRange: () => ({
        from: startOfMonth(now),
        to: endOfMonth(now),
      }),
    },
    {
      id: 'last-month',
      label: 'Last Month',
      getRange: () => {
        const lastMonth = subMonths(now, 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
      },
    },
    {
      id: 'this-quarter',
      label: 'This Quarter',
      getRange: () => {
        const m = now.getMonth();
        const y = now.getFullYear();
        let qStartMonth = 0;
        // In Indian accounting FY:
        // Q1: Apr(3)-Jun(5), Q2: Jul(6)-Sep(8), Q3: Oct(9)-Dec(11), Q4: Jan(0)-Mar(2)
        if (m >= 3 && m <= 5) qStartMonth = 3;
        else if (m >= 6 && m <= 8) qStartMonth = 6;
        else if (m >= 9 && m <= 11) qStartMonth = 9;
        else qStartMonth = 0;

        const from = new Date(y, qStartMonth, 1, 0, 0, 0, 0);
        const to = new Date(y, qStartMonth + 3, 0, 23, 59, 59, 999);
        return { from, to };
      },
    },
    {
      id: 'this-fy',
      label: 'Current FY',
      getRange: () => {
        const { from, to } = getIndianFinancialYear(now);
        return { from, to };
      },
    },
  ];
}
