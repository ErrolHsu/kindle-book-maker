import puppeteer from 'puppeteer-core'
import cheerio from 'cheerio'
import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { Spider } from './spider'
import { Cpider, Chapter } from './chapter'

const wait = time => new Promise((resolve) => setTimeout(resolve, time)); 

class Book {
  constructor(source) {
    this.source = source
    this.spider = {}
    this.urlObject = {}
    this.domain = getDomain(source)
    this.targetPagesNum = 0
    // 所有要爬的頁面路徑
    this.targetPath = []

  }

  async getTargetPages() {
    this.spider = new Spider();
    await this.spider.init();
    const html = await this.spider.get(this.source)
    const $ = cheerio.load(html,{
      decodeEntities: false
    })
  
    const lastPageUrl = $('.pgt .pg a.last').first().attr('href')
    this.urlObject = new URL(lastPageUrl)
    this.targetPagesNum = parseInt(this.urlObject.searchParams.get('page'))

    for (let i = 1; i <= this.targetPagesNum; i++) {
      this.urlObject.searchParams.set('page', i)
      this.targetPath.push(this.urlObject.href)
    }  
  }

  async build() {
    let array = this.targetPath
    let chapterStartFrom = 1

    for (let [index, url] of array.entries()) {
      const html = await this.spider.get(url)
      console.log(index)
      const $ = cheerio.load(html, {
        decodeEntities: false
      })

      const chapters = $('.t_f').toArray()

      // 卡提諾刪除第一頁第一個
      if (index === 0) {
        chapters.splice(0, 1)
      }
      buildChapter(chapters, chapterStartFrom)
      chapterStartFrom += chapters.length
    }

    this.spider.done();
  }

  // async get5Page() {
  //   let array = [this.targetPath[17], this.targetPath[18], this.targetPath[19], this.targetPath[20], this.targetPath[21]]

  //   const promises = array.map((page) => {
  //     return this.spider.get(page)
  //   })


  // }

}

function getDomain() {
  // TODO
  return 'ck101'
}

async function buildChapter(chapters, chapterStartFrom) {
  let chapterNum = chapterStartFrom
  for (let chapterHtml of chapters) {
    const chapter = new Chapter(chapterHtml, chapterNum)
    await chapter.createChapterFile()
    chapterNum += 1
  }
}

export { Book };
