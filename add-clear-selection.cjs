const fs = require('fs');

const p = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/activity-form.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  '<Select value={formData.leadId} onValueChange={(value) => setFormData({ ...formData, leadId: value })}>',
  '<Select value={formData.leadId || "none"} onValueChange={(value) => setFormData({ ...formData, leadId: value === "none" ? "" : value })}>'
);
c = c.replace(
  '<SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">{leads.map((lead) => (<SelectItem key={lead.id} value={lead.id} className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">{lead.name}</SelectItem>))}</SelectContent>',
  '<SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl"><SelectItem value="none" className="text-muted-foreground italic">— Clear Selection —</SelectItem>{leads.map((lead) => (<SelectItem key={lead.id} value={lead.id} className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">{lead.name}</SelectItem>))}</SelectContent>'
);

c = c.replace(
  '<Select value={formData.dealId} onValueChange={(value) => setFormData({ ...formData, dealId: value })}>',
  '<Select value={formData.dealId || "none"} onValueChange={(value) => setFormData({ ...formData, dealId: value === "none" ? "" : value })}>'
);
c = c.replace(
  '<SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">{deals.map((deal) => (<SelectItem key={deal.id} value={deal.id} className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">{deal.name}</SelectItem>))}</SelectContent>',
  '<SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl"><SelectItem value="none" className="text-muted-foreground italic">— Clear Selection —</SelectItem>{deals.map((deal) => (<SelectItem key={deal.id} value={deal.id} className="dark:focus:bg-slate-800 cursor-pointer rounded-lg">{deal.name}</SelectItem>))}</SelectContent>'
);

c = c.replace(
  '<Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>',
  '<Select value={formData.customerId || "none"} onValueChange={(value) => setFormData({ ...formData, customerId: value === "none" ? "" : value })}>'
);
c = c.replace(
  '<SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">\n                      {customers.map',
  '<SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">\n                      <SelectItem value="none" className="text-muted-foreground italic">— Clear Selection —</SelectItem>\n                      {customers.map'
);

fs.writeFileSync(p, c);
console.log('Added deselect option to Lead, Deal, Customer dropdowns');
