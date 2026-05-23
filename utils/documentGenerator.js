const puppeteer = require('puppeteer');
const fs = require('node:fs');

let browserInstance = null;

const defaultLaunchOptions = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-background-networking',
    '--disable-extensions',
    '--disable-sync',
    '--disable-default-apps',
    '--disable-component-update',
    '--disable-breakpad',
    '--no-first-run',
    '--no-zygote',
    '--renderer-process-limit=1',
    '--mute-audio'
  ],
  headless: process.env.PUPPETEER_HEADLESS !== '0'
};

const candidateExecutablePaths = () => {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    process.env.CHROMIUM_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
    String.raw`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
    String.raw`C:\Program Files\Chromium\Application\chrome.exe`,
    String.raw`C:\Program Files (x86)\Chromium\Application\chrome.exe`
  ].filter(Boolean);

  return candidates.filter((candidate) => {
    try {
      return fs.existsSync(candidate);
    } catch {
      return false;
    }
  });
};

const resolveExecutablePath = async () => {
  const candidates = candidateExecutablePaths();
  if (candidates.length > 0) {
    return candidates[0];
  }

  try {
    return puppeteer.executablePath();
  } catch {
    return undefined;
  }
};

const launchBrowser = async (opts = {}) => {
  const executablePath = await resolveExecutablePath();
  const launchOpts = { ...defaultLaunchOptions, ...opts, ...(executablePath ? { executablePath } : {}) };
  return puppeteer.launch(launchOpts);
};

const getBrowser = async () => {
  if (browserInstance) return browserInstance;

  try {
    browserInstance = await launchBrowser();
    // monitor browser process for unexpected close
    browserInstance.on('disconnected', () => {
      browserInstance = null;
    });
    return browserInstance;
  } catch (err) {
    console.warn('Browser launch failed, retrying once:', err.message || err);
    // try one more time after short delay
    try {
      await new Promise((r) => setTimeout(r, 500));
      browserInstance = await launchBrowser();
      browserInstance.on('disconnected', () => { browserInstance = null; });
      return browserInstance;
    } catch (error) {
      console.warn('Browser launch retry failed:', error.message || error);
      throw error;
    }
  }
};

const closeBrowser = async () => {
  if (!browserInstance) return;
  try {
    await browserInstance.close();
  } catch (e) {
    // ignore
  }
  browserInstance = null;
};

module.exports = {
  getBrowser,
  closeBrowser,
  launchBrowser
};
