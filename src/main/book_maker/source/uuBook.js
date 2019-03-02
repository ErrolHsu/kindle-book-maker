import puppeteer from 'puppeteer-core'
import cheerio from 'cheerio'
import uuidv4 from 'uuid/v4';
import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import mkdirp from 'mkdirp'
import { ncp } from 'ncp'
import { app } from 'electron'
import { Spider } from '../spider'
import { Chapter } from '../chapter'

const wait = time => new Promise((resolve) => setTimeout(resolve, time)); 
const contentOpftemplatePath = path.resolve(__filename, '../../template/content.opf')
const tocNcxtemplatePath = path.resolve(__filename, '../../template/toc.ncx')

class UUBook {
  constructor(targetUrl) {
    this.targetUrl = targetUrl
    this.spider = {}
    this.urlObject = {}
    this.uuid = ''
    this.name = ''
    this.lastPage = ''
    // 所有要爬的頁面路徑
    this.targetPath = []
    this.outline = []
    // 輸出路徑
    this.destination = ''
  }

  async generate() {
    this.spider = new Spider();
    await this.spider.init();
    await this.getBookNameAndLastPage();
    await this.initBookFolder()
    await this.getEachChapter(1, this.targetUrl)
    await this.createContentOpf()
    await this.createToc()
    console.log('Epub generated')
  }

  initBookFolder() {
    return new Promise((resolve, reject) => {
      this.uuid = uuidv4();
      const source = path.resolve(__dirname, '../../../../scaffold')
      this.destination = `/Users/errol/pro/epub/${this.name}`
      mkdirp.sync(this.destination)
      ncp(source, this.destination, function (err) {
        if (err) {
          return console.error(err);
        }
        console.log('init done!');
        resolve()
       });
    })
  }

  async getBookNameAndLastPage() {
    const html = await this.spider.get(this.targetUrl)
    const $ = cheerio.load(html, {
      decodeEntities: false
    })

    const bookNameTag = $('.h1title .shuming a')
    this.name = bookNameTag.attr('title')
    this.lastPage = bookNameTag.attr('href')
  }

  async getEachChapter(n, url) {
    console.log(n)
    console.log(url)
    const html = await this.spider.get(url)
    const chapter = new Chapter(html, n, this.destination)
    await chapter.createChapterFile()
    const outlineInfo = chapter.outLineInfo()
    this.outline.push(outlineInfo)

    // if (outlineInfo.nextUrl !== '/b/86121/') {
    if (outlineInfo.nextUrl !== this.lastPage) {
      return this.getEachChapter(n + 1, `https://tw.uukanshu.com${outlineInfo.nextUrl}`)
    } else {
      return
    }
    
  }

  createContentOpf() {
    return new Promise((resolve, reject) => {

      let manifest = '';
      let spine = '';
      let newContent = '';
      for (let chapter of this.outline) {
        manifest += `  <item id="P${chapter.outline.chapterNum}" href="${chapter.outline.chapterNum}.xhtml" media-type="application/xhtml+xml" />\n`
        spine += `  <itemref idref="P${chapter.outline.chapterNum}" />\n`
      }

      const template = fs.readFileSync(contentOpftemplatePath, 'utf8')
      newContent = template.replace(/{{name}}/, this.name)
      newContent = newContent.replace(/{{uuid}}/, this.uuid)
      newContent = newContent.replace(/{{manifest}}/, manifest)
      newContent = newContent.replace(/{{spine}}/, spine)

      const targetPath = path.resolve(this.destination, 'OEBPS/content.opf')
      fs.writeFile(targetPath, newContent, (err) => {
        return resolve()
      });
    })
  }

  createToc() {
    return new Promise((resolve, reject) => {
      let navPoint = '';
      let newContent = '';
      for (let chapter of this.outline) {
        navPoint += `  <navPoint id="chap${chapter.outline.chapterNum}" playOrder="${chapter.outline.chapterNum}">\n  <navLabel>\n  <text>${chapter.outline.title}</text>\n  </navLabel>\n  <content src="${chapter.outline.chapterNum}.xhtml"/>\n  </navPoint>\n`
      }

      const template = fs.readFileSync(tocNcxtemplatePath, 'utf8')
      newContent = template.replace(/{{name}}/, this.name)
      newContent = newContent.replace(/{{uuid}}/, this.uuid)
      newContent = newContent.replace(/{{navPoint}}/, navPoint)

      const targetPath = path.resolve(this.destination, 'OEBPS/toc.ncx')
      fs.writeFile(targetPath, newContent, (err) => {
        return resolve()
      });
    })
  }

}

export default UUBook;
