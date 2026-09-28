const fs = require('fs');

const p1 = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/pages/dashboard/[businessId]/vendors/[id]/edit/page.tsx';
let c1 = fs.readFileSync(p1, 'utf8');

c1 = c1.replace(
  /vendorType: data\.data\.vendorType \? \(data\.data\.vendorType\.toLowerCase\(\) === 'individual' \? 'Individual' : 'Company'\) : '',/g,
  "vendorType: data.data.vendorType || '',"
);
fs.writeFileSync(p1, c1);
console.log('Fixed edit/page.tsx vendorType');

const p2 = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/vendor-form.tsx';
let c2 = fs.readFileSync(p2, 'utf8');

if (!c2.includes('ISO_COUNTRY_MAP')) {
  c2 = c2.replace(
    /const COMMON_COUNTRIES = \[/,
    `const ISO_COUNTRY_MAP: Record<string, any> = {
  "India": "IN",
  "United Arab Emirates": "AE",
  "United States": "US",
  "United Kingdom": "GB",
  "Saudi Arabia": "SA",
  "Canada": "CA",
  "Australia": "AU",
  "Singapore": "SG",
  "Malaysia": "MY",
  "UAE": "AE",
  "USA": "US",
  "UK": "GB"
}

const COMMON_COUNTRIES = [`
  );
}

c2 = c2.replace(
  /defaultCountry=\{formData\.country\}/g,
  "defaultCountry={ISO_COUNTRY_MAP[formData.country] || 'US'}"
);

c2 = c2.replace(
  /\{COMMON_COUNTRIES\.map\(c => \(\s*<SelectItem key=\{c\} value=\{c\}>\{c\}<\/SelectItem>\s*\)\)\}/g,
  `{COMMON_COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      {!COMMON_COUNTRIES.includes(formData.country) && formData.country ? (
                        <SelectItem value={formData.country}>{formData.country}</SelectItem>
                      ) : null}`
);

c2 = c2.replace(
  /<SelectItem value="Other">Other<\/SelectItem>/,
  '<SelectItem value="Other">Other</SelectItem>\n                      {!["Supplier", "Manufacturer", "Service Provider", "Contractor", "Freelancer", "Transporter", "Other"].includes(formData.vendorType) && formData.vendorType ? (\n                        <SelectItem value={formData.vendorType}>{formData.vendorType}</SelectItem>\n                      ) : null}'
);

fs.writeFileSync(p2, c2);
console.log('Fixed vendor-form.tsx');
