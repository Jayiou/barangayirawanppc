const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.endsWith('/api/auth/me')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ role: 'admin', username: 'automated-test', email: 'test@example.com' }) });
      return;
    }

    if (url.endsWith('/api/residents') || url.endsWith('/api/facility-reservations') || url.endsWith('/api/reports') || url.includes('/api/announcements') || url.includes('/api/appointments') || url.endsWith('/api/disaster-advisories')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      return;
    }

    // allow other requests (scripts, assets)
    req.continue();
  });

  try {
    await page.goto('http://localhost:5173/admin.html', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('main.app-main .hero-banner h2', { timeout: 10000 });

    const headingText = await page.evaluate(() => {
      const heading = document.querySelector('main.app-main .hero-banner h2');
      return heading ? heading.textContent.trim() : '';
    });

    const pageLoaded = /Dashboard|Portal Overview|Resident Accounts|Announcements|Appointments|Facilities|Reports|Disaster Management|SMS Logs/i.test(headingText);

    console.log('ADMIN_PAGE_LOADED:' + (pageLoaded ? 'true' : 'false'));
    await browser.close();
    process.exit(pageLoaded ? 0 : 2);
  } catch (err) {
    console.error('ERROR:', err);
    await browser.close();
    process.exit(3);
  }
})();

