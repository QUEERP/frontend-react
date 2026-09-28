const fs = require('fs');

const p = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/vendor-form.tsx';
let c = fs.readFileSync(p, 'utf8');

const importReplacement = `import { cn } from '@/lib/utils'\nimport { CountrySelect } from '@/components/dashboard/country-select'`;
c = c.replace(`import { cn } from '@/lib/utils'`, importReplacement);

const selectPattern = /<Select disabled=\{submitting\} value=\{formData\.country\} onValueChange=\{handleCountryChange\}>[\s\S]*?<\/Select>/;

const replacement = `<CountrySelect 
                    disabled={submitting}
                    value={formData.country}
                    onValueChange={handleCountryChange}
                    className="h-11 rounded-xl border-border focus-visible:ring-blue-500 shadow-sm bg-card hover:bg-card"
                  />`;

c = c.replace(selectPattern, replacement);

fs.writeFileSync(p, c);
console.log('Fixed vendor-form.tsx region dropdown');
