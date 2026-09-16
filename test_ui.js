const { chromium } = require('playwright');
const fs = require('fs');

const countries = [
  "United States (US)", "Brazil (BR)", "France (FR)", "Mexico (MX)", "Italy (IT)", 
  "South Korea (KR)", "Spain (ES)", "Netherlands (NL)", "Switzerland (CH)", 
  "Saudi Arabia (SA)", "India (IN)", "United Kingdom (GB)", "Australia (AU)", 
  "Germany (DE)", "Singapore (SG)", "Japan (JP)", "South Africa (ZA)", 
  "UAE (AE)", "Canada (CA)", "New Zealand (NZ)", "Oman (OM)", "Bahrain (BH)", 
  "Ireland (IE)", "Indonesia (ID)", "Poland (PL)", "Sweden (SE)", "Norway (NO)", 
  "Belgium (BE)", "Austria (AT)", "Thailand (TH)", "Vietnam (VN)", 
  "Philippines (PH)", "China (CN)", "Taiwan (TW)"
];

(async () => {
  console.log("Starting UI automation for 34 countries...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Assuming login is needed
  await page.goto('http://localhost:5173/login');
  
  // Try to login (we need to know selectors, maybe just wait for email input)
  try {
    await page.fill('input[type="email"]', 'admin@example.com'); // default dev credential?
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 }).catch(() => {});
  } catch (e) {
    console.log("Login form not found or already logged in.");
  }

  const results = [];

  for (const countryStr of countries) {
    console.log(`Testing ${countryStr}...`);
    try {
      await page.goto('http://localhost:5173/businesses/new', { waitUntil: 'networkidle' });
      
      // Need to find Business Name input
      await page.fill('input[name="name"], input[placeholder*="Business Name"]', `Test Business ${countryStr}`);
      
      // Country dropdown - might be a Radix UI select or native select
      const countryCode = countryStr.match(/\(([^)]+)\)/)[1];
      
      // We don't know the exact DOM elements without looking.
      // A playwright script without knowing the DOM is impossible to write blindly.
      
      console.log(`Requires DOM knowledge for ${countryStr}`);
    } catch (e) {
      console.log(`Error testing ${countryStr}:`, e.message);
    }
  }

  await browser.close();
})();
