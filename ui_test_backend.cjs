const { chromium } = require('playwright');
const fs = require('fs');
const prisma = require('../backend/src/config/prisma');

const countries = [
  "US", "BR", "FR", "MX", "IT", "KR", "ES", "NL", "CH", "SA", 
  "IN", "GB", "AU", "DE", "SG", "JP", "ZA", "AE", "CA", "NZ", 
  "OM", "BH", "IE", "ID", "PL", "SE", "NO", "BE", "AT", "TH", 
  "VN", "PH", "CN", "TW"
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to http://localhost:5173/signin...");
  await page.goto('http://localhost:5173/signin');

  await page.fill('input[type="email"]', 'pwtest@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard/**', { timeout: 10000 });
  console.log("Login submitted, current URL:", page.url());
  
  let results = [];
  console.log("| Country | Selected via UI | Statutory Reports Populated? | Report Name(s) |");
  console.log("|---------|-----------------|------------------------------|----------------|");
  results.push("| Country | Selected via UI | Statutory Reports Populated? | Report Name(s) |");
  results.push("|---------|-----------------|------------------------------|----------------|");

  for (const country of countries) {
    try {
      await page.goto('http://localhost:5173/create-business');
      
      const businessName = `Test ${country} ${Date.now()}`;
      await page.fill('input[placeholder="e.g., Acme Inc."]', businessName);
      
      const selects = await page.$$('select');
      await selects[0].selectOption(country);
      await selects[1].selectOption('Trading');
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/business/create') && response.status() === 201
      ).catch(() => null);
      
      await page.click('button[type="submit"]');
      
      const response = await responsePromise;
      if (response) {
        const responseData = await response.json();
        const businessId = responseData.data.id || responseData.data.businessId;

        if (businessId) {
            // Wait a moment for the server to finish whatever it's doing
            await page.waitForTimeout(1000);
            
            await prisma.business.update({
                where: { id: businessId },
                data: { isActive: true }
            });
        }
      }

      await page.waitForURL('**/dashboard/**', { timeout: 10000 });
      
      // Force reload to pick up isActive: true for API calls
      await page.goto(page.url(), { waitUntil: 'networkidle' });

      // Wait for the skeleton loaders to disappear by waiting for the dashboard text
      await page.waitForSelector('text="Statutory Reports"', { timeout: 10000 }).catch(() => null);

      // First click the parent "Statutory Reports"
      const parentLabel = page.getByText('Statutory Reports').first();
      if (await parentLabel.isVisible()) {
          await parentLabel.click();
          await page.waitForTimeout(1000);
      }

      // Explicitly wait for the API to resolve to ensure the state updates
      await page.waitForResponse(response => response.url().includes('/api/statutory/list') && response.status() === 200, { timeout: 10000 }).catch(() => null);
      
      const statutoryLabel = page.getByText('Statutory Reports').nth(1);
      if (await statutoryLabel.isVisible()) {
          await statutoryLabel.click();
          await page.waitForTimeout(1000);
      }
      
      const reportLinks = await page.locator('a[href*="/reports/statutory/"]').allInnerTexts();
      const uniqueReports = [...new Set(reportLinks)].filter(t => t.trim() !== '');

      const isPopulated = uniqueReports.length > 0;
      const reportNames = isPopulated ? uniqueReports.join(', ') : 'None';

      const row = `| ${country} | Yes | ${isPopulated ? 'Yes' : 'No'} | ${reportNames} |`;
      console.log(row);
      results.push(row);

    } catch (e) {
      const row = `| ${country} | Failed | N/A | Error: ${e.message.split('\\n')[0]} |`;
      console.log(row);
      results.push(row);
    }
  }

  fs.writeFileSync('playwright_results.md', results.join('\n'));
  await prisma.$disconnect();
  await browser.close();
  console.log("Done");
})();
