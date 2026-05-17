const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://localhost:5000/admin';
  const baseUrl = 'http://127.0.0.1:5000';
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin12345' })
  });

  if (!loginResponse.ok) {
    throw new Error(`Admin login failed with status ${loginResponse.status}`);
  }

  const auth = await loginResponse.json();
  const customSoundUrl = '/uploads/adminSound-1779017460161-656986062.mp3';
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE:', msg.text()));

  await page.evaluateOnNewDocument((token, user, soundUrl) => {
    window.__played = { audio: 0, oscillators: 0 };

    const origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      try { window.__played.audio += 1; } catch (e) {}
      return origPlay.apply(this, arguments);
    };

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass && AudioContextClass.prototype.createOscillator) {
      const origCreateOsc = AudioContextClass.prototype.createOscillator;
      AudioContextClass.prototype.createOscillator = function () {
        try { window.__played.oscillators += 1; } catch (e) {}
        return origCreateOsc.apply(this, arguments);
      };
    }
  }, auth.token, auth.user, customSoundUrl);

  await page.goto(url, { waitUntil: 'networkidle0' });

  await page.evaluate((token, user, soundUrl) => {
    localStorage.setItem('barangayToken', token);
    localStorage.setItem('barangayUser', JSON.stringify(user));
    localStorage.setItem('adminAlertSoundUrl', soundUrl);
    localStorage.setItem('adminAlertSoundLoop', 'true');
    localStorage.setItem('adminAlertSoundVolume', '1');
  }, auth.token, auth.user, customSoundUrl);

  await page.reload({ waitUntil: 'networkidle0' });

  const storedAuth = await page.evaluate(() => ({
    token: localStorage.getItem('barangayToken'),
    user: localStorage.getItem('barangayUser'),
    sound: localStorage.getItem('adminAlertSoundUrl')
  }));
  console.log('Stored auth:', storedAuth);

  // Prime audio by clicking
  try { await page.click('body'); } catch (e) {}

  // Wait for the admin dashboard to finish loading and the initial report poll to complete.
  await page.waitForSelector('.app-shell', { timeout: 20000 });
  await page.waitForResponse(
    (response) => response.url().includes('/api/reports') && response.request().method() === 'GET',
    { timeout: 20000 }
  );

  // Post a public report from the page so the page's polling can detect it
  const reportPayload = {
    reportType: 'noise_complaint',
    description: 'Puppeteer test report',
    locationText: 'Puppeteer location',
    firstName: 'Puppet',
    lastName: 'Tester',
    contactNumber: '09170000000',
    email: `puppet-${Date.now()}@example.com`,
    address: 'Test address'
  };

  try {
    await page.evaluate(async (payload) => {
      await fetch('/api/reports/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }, reportPayload);
  } catch (e) {
    console.error('Failed to post report from page:', e);
  }

  // Wait for the page to detect and attempt playback (polling interval is 5s in composable)
  let played = false;
  try {
    await page.waitForFunction(() => window.__played && window.__played.audio > 0, { timeout: 20000 });
    played = true;
  } catch (e) {
    played = false;
  }

  console.log('Audio playback detected:', played);
  const counts = await page.evaluate(() => window.__played);
  console.log('Counts:', counts);

  await browser.close();
  process.exit(played ? 0 : 2);
})();
