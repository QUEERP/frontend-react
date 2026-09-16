const { chromium } = require('playwright');
const fs = require('fs');

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

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
  });

  page.on('response', async response => {
    if (response.url().includes('/api/business/create')) {
      const body = await response.json().catch(() => ({}));
      console.log(`API Response: ${response.status()} ${JSON.stringify(body)}`);
    }
  });

  console.log("Navigating to http://localhost:5173/signin...");
  await page.goto('http://localhost:5173/signin');

  await page.fill('input[type="email"]', 'pwtest@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  console.log("Login submitted, current URL:", page.url());
  
  let results = [];
  console.log("| Country | Selected via UI | Statutory Reports Populated? | Report Name(s) |");
  console.log("|---------|-----------------|------------------------------|----------------|");

  for (const country of countries) {
    try {
      await page.goto('http://localhost:5173/create-business');
      
      const businessName = `Test ${country} ${Date.now()}`;
      await page.fill('input[placeholder="e.g., Acme Inc."]', businessName);
      
      await page.selectOption('select', { value: country });
      
      await page.click('button[type="submit"]');
      
      try {
        await page.waitForURL('**/dashboard/**', { timeout: 10000 });
      } catch (e) {
        console.log(`Failed to navigate to dashboard. Current URL: ${page.url()}`);
        results.push(`| ${country} | Failed | N/A | Navigation failed |`);
        continue;
      }
      
      await page.waitForTimeout(3000);

      const statutoryLabel = page.locator('text="Statutory Reports"').first();
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
      console.log(`| ${country} | Failed | N/A | Error: ${e.message.split('\\n')[0]} |`);
      results.push(`| ${country} | Failed | N/A | Error: ${e.message.split('\\n')[0]} |`);
    }
  }

  fs.writeFileSync('playwright_results.md', results.join('\n'));
  
  await browser.close();
  console.log("Done");
})();
