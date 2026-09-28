const fs = require('fs');

const p = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/activity-form.tsx';
let c = fs.readFileSync(p, 'utf8');

// Add w-full to SelectTriggers
c = c.replace(/<SelectTrigger className="rounded-xl border-border/g, '<SelectTrigger className="w-full rounded-xl border-border');

// Fix type matching - change SelectItem values to uppercase and the initial state to uppercase?
// Wait, the API might expect uppercase now. Let's make the SelectItems use uppercase values but display title case.
// Also update the onValueChange typing if needed.
// Instead of changing the whole type definition, let's just normalize formData.type to Title Case when setting from DB.
c = c.replace(
  'if (data.success) setFormData(data.activity);',
  `if (data.success) {
        const act = data.activity;
        if (act.type) {
          act.type = act.type.charAt(0).toUpperCase() + act.type.slice(1).toLowerCase();
        }
        setFormData(act);
      }`
);

fs.writeFileSync(p, c);
console.log('Fixed SelectTriggers and normalized type case');
