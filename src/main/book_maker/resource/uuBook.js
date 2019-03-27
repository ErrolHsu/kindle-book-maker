import cheerio from 'cheerio'
import { app } from 'electron'
import * as log from 'electron-log'
import opencc  from 'node-opencc';
import { Spider } from '../spider'
import Epub from '../epub';

const wait = time => new Promise((resolve) => setTimeout(resolve, time));

class UUBook {
  constructor(targetPageUrl, bookName, author, lastPageUrl) {
    this.bookName = bookName
    this.author = author
    this.targetPageUrl = targetPageUrl
    this.lastPageUrl = lastPageUrl
    this.epub = {}
    this.spider = new Spider()
  }

  static async fetch(targetPageUrl) {
    const spider = new Spider();
    await spider.init();
    let bookInfo = await getBookInfo(spider, targetPageUrl);
    bookInfo = bookInfo.map( e => opencc.simplifiedToTraditional(e) )
    await spider.done()
    return { targetPageUrl, bookName: bookInfo[0], author: bookInfo[1], lastPageUrl: bookInfo[2]};
  }

  async build() {
    try {
      await this.spider.init();
      this.epub = new Epub(this.bookName, this.author)
      const { epub } = this
      await epub.init()
      await this._createChapterRecursive(1, this.targetPageUrl)
      await epub.createContentOpf()
      await epub.createToc()
      await epub.zip()
      await epub.toMobi()
      await this.spider.done()
      log.info('Book generated')
    } catch(err) {
      log.error(err)
    }
  }

  async _createChapterRecursive(n, currentPageUrl) {
    log.info(n)
    log.info(currentPageUrl)
    const html = await this.spider.get(currentPageUrl)
    const contentObject = clearUpAndGetContent(html)
    const { title, nextPageUrl, content } = contentObject

    this.epub.addChapter(n, title, content)
    if (nextPageUrl !== this.lastPageUrl && nextPageUrl !== undefined) {
      return await this._createChapterRecursive(n + 1, `https://tw.uukanshu.com${nextPageUrl}`)
    } else {
      await this.spider.done()
      return
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
  content = content.replace(/親,點擊進去,給個好評唄,分數越高更新越快,據說給新打滿分的最后都找到了漂亮的老婆哦!<br>手機站全新改版升級地址：，數據和書簽與電腦站同步，無廣告清新閱讀！<!--flagxbql-->/, '')

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
