import puppeteer from 'puppeteer-core'
import * as log from 'electron-log'

const noop = function(){};

const blockedResourceTypes = [
  'image',
  'media',
  'font',
  'texttrack',
  'object',
  'beacon',
  'csp_report',
  'imageset',
  'script',
];

const skippedResources = [
  'quantserve',
  'adzerk',
  'doubleclick',
  'adition',
  'exelator',
  'sharethrough',
  'cdn.api.twitter',
  'google-analytics',
  'googletagmanager',
  'google',
  'fontawesome',
  'facebook',
  'analytics',
  'optimizely',
  'clicktale',
  'mixpanel',
  'zedo',
  'clicksor',
  'tiqcdn',
];

class Spider {
  constructor() {
    this.browser = {}
    this.page = {}
    this.historyPages = 0
  }

  async init() {
    this.browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      // headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        ],
    });

    await this.newPage()
  }

  async newPage() {
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.94 Safari/537.36');
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      // if(request.resourceType() == 'stylesheet' || request.resourceType() == 'font' || request.resourceType() == 'image' || request.resourceType() == 'script'){
      //     request.abort();
      // }
      // else {
      //     request.continue();
      // }
      const requestUrl = request._url.split('?')[0].split('#')[0];
      if (
        blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
        skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    this.historyPages = 1
    return this.page;
  }

  async get(path, {wait, js = true} = {}) {
    let retry = 0;
    try {
      if (this.historyPages > 50) {
        await this.page.close()
        this.page = await this.newPage()
      }

      const { page } = this
      if (!js) {
        await page.setJavaScriptEnabled(false)
      }
      await page.goto(path);
      if (wait) {
        await page.waitForSelector( wait, { visible : true, timeout: 30000 } )
      }
      const html = await page.content();
      this.historyPages += 1
      return html;
    } catch (err) {
      log.error(err)
      throw new Error('不支援的頁面或超時');
    }
  }

  async done() {
    console.log('spider done!')
    this.browser.close()
  }
  
}

export { Spider };
