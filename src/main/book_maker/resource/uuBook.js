import cheerio from 'cheerio'
import { app } from 'electron'
import * as path from 'path'
import * as log from 'electron-log'
import opencc  from 'node-opencc';
import { Spider } from '../spider'
import Epub from '../epub';
import { logMsg } from '../../helper/logger'

const wait = time => new Promise((resolve) => setTimeout(resolve, time));

class UUBook {
  constructor(targetPageUrl, bookName, author) {
    this.domain = 'https://www.uukanshu.com'
    this.bookName = bookName
    this.author = author
    this.targetPageUrl = targetPageUrl
    this.indexPageUrl = ''
    this.epub = {}
    this.spider = new Spider()
    this.output = path.resolve(app.getPath('downloads'), 'eBooks')
  }

  static async fetch(targetPageUrl) {
    const spider = new Spider();
    await spider.init();
    let bookInfo = await getBookInfo(spider, targetPageUrl);
    bookInfo = bookInfo.map( e => opencc.simplifiedToTraditional(e) )
    await spider.done()
    return { targetPageUrl, bookName: bookInfo[0], author: bookInfo[1] };
  }

  async build() {
    await this.spider.init();
    const bookInfo = await getBookInfo(this.spider, this.targetPageUrl);
    this.indexPageUrl = bookInfo[2]
    this.epub = new Epub(this.bookName, this.author, this.output)
    const { epub } = this
    await epub.init()

    try {
      await this._createChapterRecursive(1, this.targetPageUrl)
    } catch(err) {
      log.error(err)
    }

    await epub.build()
    await this.spider.done()
    logMsg('電子書製作完成。')
    return this.output
  }

  async _createChapterRecursive(n, currentPageUrl) {
    logMsg(`Get ${currentPageUrl} ...`)
    const html = await this.spider.get(currentPageUrl)
    const contentObject = clearUpAndGetContent(html)
    const { title, nextPageUrl, content } = contentObject

    try {
      await this.epub.addChapter(n, title, content)
    } catch(err) {
      log.error(err)
    }
    // 當下一頁是 index 或是 undefined 就停止
    if (nextPageUrl === this.indexPageUrl || nextPageUrl === undefined) {
      await this.spider.done()
      return
    } else {
      return this._createChapterRecursive(n + 1, `${this.domain}${nextPageUrl}`)
    }
  }

}

// 清理並得到章節內文資訊
function clearUpAndGetContent(html) {
  const $ = cheerio.load(html, {
    decodeEntities: false
  })
  $('img').remove()
  $('.quote').remove()
  $('blockquote').remove()
  $('.ad_content').remove()

  const title = $('#timu').text()
  const nextPageUrl = $('#next').attr('href')
  let content = $('#contentbox').html()
                .replace(/[UuＵｕ][UuＵｕ].{1,20}[ｃcCＣ][oｏＯO][mｍMＭ]/igm, '')

  return { title, nextPageUrl, content }
}

async function getBookInfo(spider, targetPageUrl) {
  const html = await spider.get(targetPageUrl)
  const $ = cheerio.load(html, {
    decodeEntities: false
  })

  const bookNameTag = $('.h1title .shuming a')
  const lastPageUrl = bookNameTag.attr('href')
  const bookName = bookNameTag.attr('title')
  const author = $('.h1title .author').text().replace(/作者：/, '')

  return [bookName, author, lastPageUrl]
}

export default UUBook;
