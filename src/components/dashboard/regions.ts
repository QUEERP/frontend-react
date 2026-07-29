export const ALL_REGIONS = [
  "AFGHANISTAN", "ALBANIA", "ALGERIA", "ARGENTINA", "AUSTRALIA", "AUSTRIA", "BAHRAIN", "BANGLADESH",
  "BELGIUM", "BRAZIL", "CANADA", "CHILE", "CHINA", "COLOMBIA", "CROATIA", "CZECH_REPUBLIC", "DENMARK",
  "EGYPT", "ETHIOPIA", "FINLAND", "FRANCE", "GERMANY", "GHANA", "GREECE", "HONG_KONG", "HUNGARY", "INDIA",
  "INDONESIA", "IRAN", "IRAQ", "IRELAND", "ISRAEL", "ITALY", "JAPAN", "JORDAN", "KAZAKHSTAN", "KENYA",
  "KUWAIT", "LEBANON", "MALAYSIA", "MEXICO", "MOROCCO", "MYANMAR", "NEPAL", "NETHERLANDS", "NEW_ZEALAND",
  "NIGERIA", "NORWAY", "OMAN", "PAKISTAN", "PHILIPPINES", "POLAND", "PORTUGAL", "QATAR", "ROMANIA",
  "RUSSIA", "SAUDI_ARABIA", "SINGAPORE", "SOUTH_AFRICA", "SOUTH_KOREA", "SPAIN", "SRI_LANKA", "SWEDEN",
  "SWITZERLAND", "TAIWAN", "TANZANIA", "THAILAND", "TUNISIA", "TURKEY", "UKRAINE", "UNITED_ARAB_EMIRATES",
  "UNITED_KINGDOM", "UNITED_STATES", "VENEZUELA", "VIETNAM", "ZIMBABWE", "UAE", "OTHER"
];

export const REGION_CURRENCY_MAP: Record<string, string> = {
  "AFGHANISTAN": "Afghanistan (؋)", "ALBANIA": "Albania (L)", "ALGERIA": "Algeria (د.ج)", "ARGENTINA": "Argentina ($)",
  "AUSTRALIA": "Australia (A$)", "AUSTRIA": "Austria (€)", "BAHRAIN": "Bahrain (.د.ب)", "BANGLADESH": "Bangladesh (৳)",
  "BELGIUM": "Belgium (€)", "BRAZIL": "Brazil (R$)", "CANADA": "Canada (C$)", "CHILE": "Chile ($)",
  "CHINA": "China (¥)", "COLOMBIA": "Colombia ($)", "CROATIA": "Croatia (€)", "CZECH_REPUBLIC": "Czech Republic (Kč)",
  "DENMARK": "Denmark (kr)", "EGYPT": "Egypt (E£)", "ETHIOPIA": "Ethiopia (Br)", "FINLAND": "Finland (€)",
  "FRANCE": "France (€)", "GERMANY": "Germany (€)", "GHANA": "Ghana (GH₵)", "GREECE": "Greece (€)",
  "HONG_KONG": "Hong Kong (HK$)", "HUNGARY": "Hungary (Ft)", "INDIA": "India (₹)", "INDONESIA": "Indonesia (Rp)",
  "IRAN": "Iran (﷼)", "IRAQ": "Iraq (ع.د)", "IRELAND": "Ireland (€)", "ISRAEL": "Israel (₪)",
  "ITALY": "Italy (€)", "JAPAN": "Japan (¥)", "JORDAN": "Jordan (د.ا)", "KAZAKHSTAN": "Kazakhstan (₸)",
  "KENYA": "Kenya (KSh)", "KUWAIT": "Kuwait (د.ك)", "LEBANON": "Lebanon (ل.ل)", "MALAYSIA": "Malaysia (RM)",
  "MEXICO": "Mexico ($)", "MOROCCO": "Morocco (د.م.)", "MYANMAR": "Myanmar (Ks)", "NEPAL": "Nepal (रू)",
  "NETHERLANDS": "Netherlands (€)", "NEW_ZEALAND": "New Zealand (NZ$)", "NIGERIA": "Nigeria (₦)", "NORWAY": "Norway (kr)",
  "OMAN": "Oman (ر.ع.)", "PAKISTAN": "Pakistan (Rs)", "PHILIPPINES": "Philippines (₱)", "POLAND": "Poland (zł)",
  "PORTUGAL": "Portugal (€)", "QATAR": "Qatar (ر.ق)", "ROMANIA": "Romania (lei)", "RUSSIA": "Russia (₽)",
  "SAUDI_ARABIA": "Saudi Arabia (﷼)", "SINGAPORE": "Singapore (S$)", "SOUTH_AFRICA": "South Africa (R)", "SOUTH_KOREA": "South Korea (₩)",
  "SPAIN": "Spain (€)", "SRI_LANKA": "Sri Lanka (Rs)", "SWEDEN": "Sweden (kr)", "SWITZERLAND": "Switzerland (CHF)",
  "TAIWAN": "Taiwan (NT$)", "TANZANIA": "Tanzania (TSh)", "THAILAND": "Thailand (฿)", "TUNISIA": "Tunisia (د.ت)",
  "TURKEY": "Turkey (₺)", "UKRAINE": "Ukraine (₴)", "UNITED_ARAB_EMIRATES": "United Arab Emirates (د.إ)",
  "UNITED_KINGDOM": "United Kingdom (£)", "UNITED_STATES": "United States ($)", "VENEZUELA": "Venezuela (Bs.)",
  "VIETNAM": "Vietnam (₫)", "ZIMBABWE": "Zimbabwe (Z$)", "UAE": "UAE (د.إ)", "OTHER": "Other"
};

export function getRegionDisplayLabel(region: string) {
  if (!region) return '';
  if (REGION_CURRENCY_MAP[region]) return REGION_CURRENCY_MAP[region];
  return region.replace(/_/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
}
