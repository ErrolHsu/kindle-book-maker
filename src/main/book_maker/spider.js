import puppeteer from 'puppeteer-core'

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

    this.page.historyPages = 0
    return this.page;
  }

  async get(path) {
    let retry = 0;
    try {
      if (this.page.historyPages > 50) {
        await this.page.close()
        this.page = await this.newPage()
      }

      const { page } = this
      await page.goto(path);
      await page.waitForSelector( '#contentbox', { visible : true } );
      const html = await page.content();
      // page.removeAllListeners()
      // await page.close()
      page.historyPages += 1
      return html;
    } catch (err) {
      if (retry < 3) {
        await this.page.close()
        this.page = await this.newPage()

        retry += 1
        await this.page.goto(path);
        await this.page.waitForSelector( '#contentbox', { visible : true } );
        const html = await this.page.content();
      } else {
        throw err
      }
    }
  }

  async done() {
    console.log('spider done!')
    this.browser.close()
  }
  
}

export { Spider };
