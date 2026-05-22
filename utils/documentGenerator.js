const puppeteer = require('puppeteer');

let browserInstance = null;

const defaultLaunchOptions = {
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: process.env.PUPPETEER_HEADLESS !== '0'
};

const launchBrowser = async (opts = {}) => {
  const launchOpts = Object.assign({}, defaultLaunchOptions, opts);
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
    // try one more time after short delay
    try {
      await new Promise((r) => setTimeout(r, 500));
      browserInstance = await launchBrowser();
      browserInstance.on('disconnected', () => { browserInstance = null; });
      return browserInstance;
    } catch (err2) {
      throw err2;
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
