export const getTaxEngineConfig = (country: string | undefined | null) => {
  const normalized = (country || '').trim().toLowerCase();
  if (normalized === 'india') return { name: 'India GST Engine', returnLabel: 'GST Returns', summaryLabel: 'GST Summaries', returnType: 'GST_RETURN', summaryType: 'GST_SUMMARY' };
  if (normalized === 'uae' || normalized === 'united arab emirates') return { name: 'UAE VAT Engine', returnLabel: 'VAT Returns', summaryLabel: 'VAT Summaries', returnType: 'VAT_RETURN', summaryType: 'VAT_SUMMARY' };
  return null;
};
