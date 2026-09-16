const { chromium } = require('playwright');
const fs = require('fs');
const prisma = require('../backend/src/config/prisma');

const countries = ["US"];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to http://localhost:5173/signin...");
  await page.goto('http://localhost:5173/signin');

  await page.fill('input[type="email"]', 'pwtest@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  
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
            console.log("Updating business:", businessId);
            await prisma.business.update({
                where: { id: businessId },
                data: { isActive: true }
            });
            console.log("Business active");
        }
      }

      await page.waitForURL('**/dashboard/**', { timeout: 10000 });
      
      // Reload the page so the API call uses the updated isActive state
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      // First click the parent "Statutory & Compliance"
      const parentLabel = page.getByText('Statutory & Compliance').first();
      if (await parentLabel.isVisible()) {
          console.log("Clicking Statutory & Compliance");
          await parentLabel.click();
          await page.waitForTimeout(1000);
      }

      const statutoryLabel = page.getByText('Statutory Reports').first();
      if (await statutoryLabel.isVisible()) {
          console.log("Clicking Statutory Reports");
          await statutoryLabel.click();
          await page.waitForTimeout(1000);
      }
      
      await page.screenshot({ path: `screenshot_${country}.png`, fullPage: true });
      
      const reportLinks = await page.locator('a[href*="/reports/statutory/"]').allInnerTexts();
      console.log("Report links:", reportLinks);

    } catch (e) {
      console.error(e);
    }
  }

  await prisma.$disconnect();
  await browser.close();
  console.log("Done");
})();
