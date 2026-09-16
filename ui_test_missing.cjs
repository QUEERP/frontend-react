const { chromium } = require('playwright');
const fs = require('fs');
const prisma = require('../backend/src/config/prisma');

const countries = ["IN", "NZ", "BH", "NO", "AE", "CA"];

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
            await page.waitForTimeout(1000);
            
            await prisma.business.update({
                where: { id: businessId },
                data: { isActive: true }
            });
            await page.waitForTimeout(1000);
        }
      }

      await page.waitForURL('**/dashboard/**', { timeout: 30000 });
      await page.waitForLoadState('networkidle');

      const reportsParent = page.getByRole('button', { name: 'Statutory Reports' });
      await reportsParent.click();
      
      await page.waitForTimeout(1000);

      const reportsList = page.getByText('Statutory Reports').nth(1);
      await reportsList.click();

      await page.waitForTimeout(1000);
      
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

  await prisma.$disconnect();
  await browser.close();
  console.log("Done missing tests");
})();
