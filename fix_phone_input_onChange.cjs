const fs = require('fs');

const p = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/ui/phone-input.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  `      if (match && match.code !== selectedCountry) {
        setSelectedCountry(match.code);
        if (number) {
          onChange(\`\${match.dialCode} \${number}\`);
        } else if (!value) {
          // If no value, we just updated the country code visually
        }
      }`,
  `      if (match && match.code !== selectedCountry) {
        setSelectedCountry(match.code);
        let numToUse = number;
        if (!numToUse && value && !value.startsWith('+')) {
          numToUse = value.replace(/^[-\\s]+/, '');
        }
        if (numToUse) {
          onChange(\`\${match.dialCode} \${numToUse}\`);
        }
      }`
);

fs.writeFileSync(p, c);
console.log('Fixed PhoneInput onChange');
