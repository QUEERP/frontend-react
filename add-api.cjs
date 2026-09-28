const fs = require('fs');

const p = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/lib/api/purchase-orders.ts';
let c = fs.readFileSync(p, 'utf8');

if (!c.includes('markReceived')) {
  c = c.replace(
    'deletePurchaseOrder(businessId: string, orderId: string): Promise<{ success: boolean }> {',
    `async markReceived(businessId: string, orderId: string): Promise<{ success: boolean }> {
    const token = getCookie('token') || getCookie('accessToken');
    const response = await fetch(\`\${API_ROOT}/purchase-order/\${orderId}/receive-all\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'x-business-id': businessId
      }
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }
    return response.json();
  },

  deletePurchaseOrder(businessId: string, orderId: string): Promise<{ success: boolean }> {`
  );
  fs.writeFileSync(p, c);
}
console.log('Updated API lib');
