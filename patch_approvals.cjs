const fs = require('fs');
const file = 'C:/Users/DELL/Downloads/new-queerp/frontend/src/components/dashboard/leave-approvals-page-client.tsx';
let content = fs.readFileSync(file, 'utf8');

const normalizeLogic = `
const normalizeLeaveTypes = (value: unknown) => {
  let parsed: unknown = value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try { parsed = JSON.parse(trimmed) } catch { return [] }
  }
  if (!Array.isArray(parsed)) return []
  return parsed.map((item: any) => {
    const code = String(item?.code || item?.title || item?.name || '').trim()
    const title = String(item?.title || item?.name || code).trim()
    return { code, title }
  }).filter((item) => item.code.length > 0)
}
`;

if (!content.includes('normalizeLeaveTypes')) {
  content = content.replace('export function LeaveApprovalsPageClient', normalizeLogic + '\nexport function LeaveApprovalsPageClient');
}

const mapLogic = `      const settingsData = (business as any)?.settings
      const settings = Array.isArray(settingsData) ? settingsData[0] || null : settingsData || null
      const leaveTypes = normalizeLeaveTypes(settings?.leaveTypes)
      const getLeaveTitle = (code: string) => {
        const found = leaveTypes.find(lt => lt.code === code)
        return found ? found.title : code
      }

      // Leaves`;

if (!content.includes('getLeaveTitle(')) {
  content = content.replace('// Leaves', mapLogic);
  content = content.replace(
    /details: `Leave Type: \$\{item\.leaveCode\} \| Duration: \$\{item\.duration === 'HALF' \? 'Half Day' : 'Full Day'\}`/g,
    "details: `Leave Type: ${getLeaveTitle(item.leaveCode)} | Duration: ${item.duration === 'HALF' ? 'Half Day' : 'Full Day'}`"
  );
}

if (content.includes('const { loading: businessLoading } = useBusinessData()')) {
  content = content.replace(
    'const { loading: businessLoading } = useBusinessData()',
    'const { business, loading: businessLoading } = useBusinessData()'
  );
  content = content.replace(
    '}, [API_BASE, businessId])',
    '}, [API_BASE, businessId, business])'
  );
}

fs.writeFileSync(file, content);
console.log('Modified leave-approvals-page-client.tsx');
