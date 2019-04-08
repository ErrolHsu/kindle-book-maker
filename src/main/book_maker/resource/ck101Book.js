import cheerio from 'cheerio'
import { app } from 'electron'
import * as path from 'path'
import * as log from 'electron-log'
import opencc  from 'node-opencc';
import { Spider } from '../spider'
import Epub from '../epub';
import { logMsg } from '../../helper/message'

class CK101Book {
  constructor(targetPageUrl, bookName, author) {
    this.bookName = bookName
    this.author = author
    this.targetPageUrl = targetPageUrl
    this.epub = {}
    this.spider = new Spider()
    this.output = path.resolve(app.getPath('downloads'), 'eBooks')
  }

  static async fetch(targetPageUrl) {
    const spider = new Spider();
    await spider.init();
    let bookInfo = await getBookInfo(spider, targetPageUrl);
    // bookInfo = bookInfo.map( e => opencc.simplifiedToTraditional(e) )
    await spider.done()
    return { targetPageUrl, bookName: bookInfo[0], author: bookInfo[1] };
  }

  async build() {
    await this.spider.init();
    this.epub = new Epub(this.bookName, this.author, this.output, false)
    const { epub } = this
    await epub.init()

    try {
      await this._createChapterRecursive(1, this.targetPageUrl)
    } catch(err) {
      log.error(err)
    }

    const ebookAt = await epub.build()
    await this.spider.done()
    logMsg('電子書製作完成。')
    return ebookAt
  }

  async _createChapterRecursive(n, currentPageUrl) {
    logMsg(`Get ${currentPageUrl} ...`)
    const html = await this.spider.get(currentPageUrl, {wait: '#postlist', js: false})
    const $ = cheerio.load(html, {
      decodeEntities: false
    })
    const nextPageUrl = $('#pgt a.nxt').attr('href')

    const chaps = $('#postlist').find('.t_f').toArray()

    for(let [index, chap] of chaps.entries()) {
      const contentObject = clearUpAndGetTitle($(chap).html())
      let { title, content } = contentObject

      try {
        await this.epub.addChapter(n + index, title, content)
      } catch(err) {
        log.error(err)
      }
    }

    // 當下一頁是 index 或是 undefined 就停止
    if (nextPageUrl === undefined) {
      await this.spider.done()
      return
    } else {
      return this._createChapterRecursive(n + chaps.length, `${nextPageUrl}`)
    }
  }
}

// 清理並得到章節內文與標題
function clearUpAndGetTitle(html) {
  const $ = cheerio.load(html, {
    decodeEntities: false
  })
  $('img').remove()
  $('.quote').remove()
  $('blockquote').remove()
  $('.ad_content').remove()

  let title;
  const content = $.html()
                   .replace(/本帖最後.*編輯/, '')

  const titleArray = html.trim().substring(0, 100).match(/.+?(?=<br)/)
  if (titleArray !== null && titleArray[0] !== '') {
    title = cheerio.load(titleArray[0]).text().trim()
  } else {
    title = $.text().trim().substring(0, 15)
  }

  return { title, content }
}

async function getBookInfo(spider, targetPageUrl) {
  try {
    let bookName = ''
    let author = ''
    const html = await spider.get(targetPageUrl, {js: false})
    const $ = cheerio.load(html, {
      decodeEntities: false
    })

    const subject = $('#thread_subject').text()

    if (subject.length === 0) {
      throw new Error('不支援的頁面')
    }

    const subjectArray = subject.replace(/\[.*\]/, '')
                                .replace(/【.*】/, '')
                                .replace(/\{.*\}/, '')
                                .replace(/\(.*\)/, '')
                                .replace(/（.*）/, '')
                                .replace(/『.*』/, '')
                                .replace(/「.*」/, '')
                                .replace(/[:：]/, '')
                                .split('作者')

    if (subjectArray[0] !== undefined) {
      bookName = subjectArray[0].trim()
    }

    if (subjectArray[1] !== undefined) {
      author = subjectArray[1].trim()
    }
    return [bookName, author]
  } catch(err) {
    throw err;
  }
}

export default CK101Book;
