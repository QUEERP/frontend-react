const fs = require('fs');

const p = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/vendor-form.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  'defaultCountry={ISO_COUNTRY_MAP[formData.country] || \'US\'}',
  'defaultCountry={formData.country?.trim() || \'US\'}'
);

fs.writeFileSync(p, c);
console.log('Fixed vendor form defaultCountry');
