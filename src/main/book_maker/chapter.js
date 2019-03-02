import * as path from 'path'
import * as fs from 'fs'
import cheerio from 'cheerio'

const templatePath = path.resolve(__filename, '../template/chapter.xhtml')

class Chapter {
  constructor(html, chapterNum, destination) {
    const $ = cheerio.load(html, {
      decodeEntities: false
    })

    this.$ = $
    $('img').remove()
    $('.quote').remove()
    $('blockquote').remove()
    this.chapterNum = chapterNum
    this.title = this.getTitle()
    this.nextUrl = this.getNextUrl()
    this.content = this.getContent()
    this.destination = destination
  }

  getTitle() {
    return this.$('#timu').text()
  }

  getNextUrl() {
    return this.$('#next').attr('href')
  }

  getContent() {
    const $ = this.$
    $('img').remove()
    $('.quote').remove()
    $('blockquote').remove()
    $('.ad_content').remove()

    let content = $('#contentbox').html()
    content = content.replace(/親,點擊進去,給個好評唄,分數越高更新越快,據說給新打滿分的最后都找到了漂亮的老婆哦!<br>手機站全新改版升級地址：，數據和書簽與電腦站同步，無廣告清新閱讀！<!--flagxbql-->/, '')
    return content
  }

  outLineInfo() {
    return {
      outline: {
        title: this.title,
        chapterNum: this.chapterNum
      },
      nextUrl: this.nextUrl
    }
  }

  createChapterFile() {
    return new Promise((resolve, reject) => {
      let xhtml = '';
      const template = fs.readFileSync(templatePath, 'utf8')
      xhtml = template.replace(/{{title}}/, `${this.title}`)
      xhtml = xhtml.replace(/{{contentTitle}}/, `<h2>${this.title}</h2><br /><br />`)
      xhtml = xhtml.replace(/{{body}}/, `<div>${this.content}</div>`)
      xhtml = xhtml.replace(/<br>/g, '<br \/>')


      const targetPath = path.resolve(this.destination, `OEBPS/${this.chapterNum}.xhtml`)
      fs.writeFile(targetPath, xhtml, (err) => {
        return resolve()
      });
    })
  }

}

export { Chapter }
