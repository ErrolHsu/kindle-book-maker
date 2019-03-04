import cheerio from 'cheerio'
import { app } from 'electron'
import { Spider } from '../spider'
import Epub from '../epub';

const wait = time => new Promise((resolve) => setTimeout(resolve, time)); 

class UUBook {
  constructor(firstPageUrl, type = 'mobi') {
    this.firstPageUrl = firstPageUrl
    this.lastPageUrl = ''
    this.spider = {}
    this.epub = {}
    this.outline = []
    this.type = type
  }

  async generate() {
    this.spider = new Spider();
    await this.spider.init();
    const bookInfo = await getBookInfo(this.spider, this.firstPageUrl);
    const { name, author, lastPageUrl } = bookInfo;
    this.lastPageUrl = lastPageUrl
    this.epub = new Epub(name, author)
    const epub = this.epub
    await epub.init()
    await this.createChapterRecursive(1, this.firstPageUrl)
    await epub.createContentOpf()
    await epub.createToc()
    await epub.zip()
    await epub.toMobi()
    console.log('Book generated')
  }

  async createChapterRecursive(n, targetUrl) {
    console.log(n)
    console.log(targetUrl)
    const html = await this.spider.get(targetUrl)
    const contentObject = clearUpAndGetContent(html)
    const { title, nextPageUrl, content } = contentObject

    this.epub.addChapter(n, title, content)
    if (nextPageUrl !== this.lastPageUrl) {
      return await this.createChapterRecursive(n + 1, `https://tw.uukanshu.com${nextPageUrl}`)
    } else {
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

async function getBookInfo(spider, targetUrl) {
  const html = await spider.get(targetUrl)
  const $ = cheerio.load(html, {
    decodeEntities: false
  })

  const bookNameTag = $('.h1title .shuming a')
  const lastPageUrl = bookNameTag.attr('href')
  const name = bookNameTag.attr('title')
  const author = $('.h1title .author').text().replace(/作者：/, '')

  return {name, author, lastPageUrl}
}

export default UUBook;
