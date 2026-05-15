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

    if (url.endsWith('/api/document-requests')) {
      const docs = [
        {
          _id: 'doc1',
          documentType: 'clearance',
          requesterType: 'resident',
          status: 'approved',
          purpose: 'Test preview',
          createdAt: new Date().toISOString()
        }
      ];
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(docs) });
      return;
    }

    if (url.endsWith('/api/residents') || url.endsWith('/api/facility-reservations') || url.endsWith('/api/reports') || url.includes('/api/announcements') || url.includes('/api/appointments')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      return;
    }

    // allow other requests (scripts, assets)
    req.continue();
  });

  try {
    await page.goto('http://localhost:5173/admin.html', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit for app to initialize
    await new Promise(r => setTimeout(r, 1500));

    // Click Documents nav button
    await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('nav.sidebar-nav button'));
      const docBtn = navButtons.find(b => /Documents/i.test(b.textContent));
      if (docBtn) docBtn.click();
    });

    // Wait for documents table to render with our mocked document
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('tbody tr')).some(r => /clearance/i.test(r.innerText));
    }, { timeout: 5000 });

    // Click View button for the clearance row
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const target = rows.find(r => /clearance/i.test(r.innerText));
      const btn = target && target.querySelector('button.icon-button');
      if (btn) btn.click();
    });

    // Wait for modal
    await page.waitForSelector('.admin-modal', { timeout: 5000 });

    // Check for Preview PDF button text inside modal
    const previewVisible = await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      if (!modal) return false;
      // Look for a button that contains 'Preview' or has fa-eye icon
      const btns = Array.from(modal.querySelectorAll('button'));
      return btns.some(b => /preview/i.test(b.textContent) || b.querySelector('i.fa-eye'));
    });

    console.log('PREVIEW_VISIBLE:' + (previewVisible ? 'true' : 'false'));
    await browser.close();
    process.exit(previewVisible ? 0 : 2);
  } catch (err) {
    console.error('ERROR:', err);
    await browser.close();
    process.exit(3);
  }
})();

