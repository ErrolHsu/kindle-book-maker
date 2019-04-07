import { app } from 'electron'
import * as path from 'path'
import fs from 'fs-extra'
import * as log from 'electron-log'
import { tidy }  from './html_tidy'
import JSZip from 'jszip'
import uuidv4 from 'uuid/v4';
import opencc  from 'node-opencc';
import { spawn } from 'child_process'
import { BIN_PATH, EXTRA_FILES_PATH } from '../helper/path_helper'
import { logMsg, loading } from '../helper/message'

const scaffoldPath = app.isPackaged ? path.join(EXTRA_FILES_PATH, 'scaffold') : path.resolve(__dirname, 'scaffold')
const templatePath = app.isPackaged ? path.join(EXTRA_FILES_PATH, 'template') : path.resolve(__dirname, 'template')
const defaultOutputPath = path.resolve(app.getPath('downloads'), 'eBooks')

export default class Epub {
  constructor(name, author, output = defaultOutputPath, translate  = true) {
    this.translate = translate
    this.name = this._translate(name)
    this.author = this._translate(author)
    this.output = path.resolve(output, this.name)
    this.tmp = path.resolve(this.output, 'tmp')
    this.uuid = uuidv4();
    this.chapters = []
  }

  static tidyHtml(html) {
    return new Promise((resolve, reject) => {
      let tidyOpts = {
        doctype: 'auto',
        hideComments: false, //  multi word options can use a hyphen or "camel case"
        outputXhtml: true,
        charEncoding: 'raw',
        showBodyOnly: true,
        indent: true
      }

      tidy(html, tidyOpts, (err, xhtml) => {
        log.info('tidy...')
        if (err) {
          log.error(err)
          reject(err)
        }
        resolve(xhtml)
      })
    })
  }

  static translate(text) {
    return opencc.simplifiedToTraditional(text);
  }

  init() {
    return new Promise((resolve, reject) => {
      fs.ensureDirSync(this.output)
      fs.ensureDirSync(this.tmp)
      fs.copy(scaffoldPath, this.tmp, err => {
        if (err) {
          throw new Error(err)
        }
        log.info('init done!');
        resolve()
      });
    })
  }

  async build() {
    await this._createContentOpf()
    await this._createToc()
    await this._zip()
    await this._toMobi()
    await this._clearTmpFile()
    return this.output
  }

  addChapter(chapterNumber, title, content) {
    loading()
    const chapterTemplatePath = path.resolve(templatePath, 'chapter.xhtml')
    const zhTitle = this._translate(title)
    return new Promise(async (resolve, reject) => {
      let tidyContent = await Epub.tidyHtml(content)
      const chapterOutputPath = path.resolve(this.tmp, 'OEBPS', `${chapterNumber}.xhtml`)
      let xhtml = fs.readFileSync(chapterTemplatePath, 'utf8')
                      .replace(/{{title}}/, `${title}`)
                      .replace(/{{contentTitle}}/, `<h2>${title}</h2><br /><br />`)
                      .replace(/{{body}}/, `<div>${tidyContent}</div>`)

      this.chapters.push({
        title: zhTitle,
        chapterNumber,
        chapterOutputPath
      })
      // 繁簡轉換
      xhtml = this._translate(xhtml)

      fs.writeFile(chapterOutputPath, xhtml, (err) => {
        logMsg(`${zhTitle} / done`)
        return resolve()
      });
    })
  }

  _createContentOpf() {
    logMsg('Create ContentOpf ...')
    const contentOpftemplatePath = path.resolve(templatePath, 'content.opf')
    return new Promise((resolve, reject) => {
      let manifest = '';
      let spine = '';
      let newContent = '';
      for (let chapter of this.chapters) {
        manifest += `  <item id="P${chapter.chapterNumber}" href="${chapter.chapterNumber}.xhtml" media-type="application/xhtml+xml" />\n`
        spine += `  <itemref idref="P${chapter.chapterNumber}" />\n`
      }

      const template = fs.readFileSync(contentOpftemplatePath, 'utf8')
      newContent = template.replace(/{{name}}/, this.name)
                  .replace(/{{author}}/, this.author)
                  .replace(/{{uuid}}/, this.uuid)
                  .replace(/{{manifest}}/, manifest)
                  .replace(/{{spine}}/, spine)

      const targetPath = path.resolve(this.tmp, 'OEBPS/content.opf')
      fs.writeFile(targetPath, newContent, (err) => {
        return resolve()
      });
    })
  }

  _createToc() {
    logMsg('Create Toc ...')
    const tocNcxtemplatePath = path.resolve(templatePath, 'toc.ncx')
    return new Promise((resolve, reject) => {
      let navPoint = '';
      let newContent = '';
      for (let chapter of this.chapters) {
        navPoint += `  <navPoint id="chap${chapter.chapterNumber}" playOrder="${chapter.chapterNumber}">\n  <navLabel>\n  <text>${chapter.title}</text>\n  </navLabel>\n  <content src="${chapter.chapterNumber}.xhtml"/>\n  </navPoint>\n`
      }

      const template = fs.readFileSync(tocNcxtemplatePath, 'utf8')
      newContent = template.replace(/{{name}}/, this.name)
      newContent = newContent.replace(/{{uuid}}/, this.uuid)
      newContent = newContent.replace(/{{navPoint}}/, navPoint)

      const targetPath = path.resolve(this.tmp, 'OEBPS/toc.ncx')
      fs.writeFile(targetPath, newContent, (err) => {
        return resolve()
      });
    })
  }

  _zip() {
    logMsg('Create Epub ...')
    return new Promise((resolve, reject) => {
      const zip = new JSZip();
      const output = this.output
      const tmp = this.tmp
      const name = this.name
      zip.file("mimetype", fs.readFileSync(`${tmp}/mimetype`), {compression: "STORE"});
      zip.folder("META-INF").file('container.xml', fs.readFileSync(`${tmp}/META-INF/container.xml`), {compression: "DEFLATE"})
      zip.folder("OEBPS").file('page-template.xpgt', fs.readFileSync(`${tmp}/OEBPS/page-template.xpgt`), {compression: "DEFLATE"})
      zip.folder("OEBPS").file('content.opf', fs.readFileSync(`${tmp}/OEBPS/content.opf`), {compression: "DEFLATE"})
      zip.folder("OEBPS").file('stylesheet.css', fs.readFileSync(`${tmp}/OEBPS/stylesheet.css`), {compression: "DEFLATE"})
      zip.folder("OEBPS").file('toc.ncx', fs.readFileSync(`${tmp}/OEBPS/toc.ncx`), {compression: "DEFLATE"})

      for (let chapter of this.chapters) {
        zip.folder("OEBPS").file(`${chapter.chapterNumber}.xhtml`, fs.readFileSync(`${tmp}/OEBPS/${chapter.chapterNumber}.xhtml`), {compression: "DEFLATE"})
      }

      zip.generateAsync({type:"nodebuffer"}).then(function(content) {
        fs.writeFile(`${output}/${name}.epub`, content, function(err) {
          resolve()
        });
      });

    })
  }

  _toMobi() {
    logMsg('Create Mobi ...')
    return new Promise((resolve, reject) => {
      const kindlegen = path.join(BIN_PATH, 'kindlegen')
      const epubPath = path.resolve(this.output, `${this.name}.epub`)
      let gen = spawn(kindlegen, [epubPath]);
      gen.stdout.pipe(process.stdout);
      gen.stderr.pipe(process.stderr);
    
      gen.on('close', function(code) {
        log.info(code)
        resolve(code);
      });
    })
  }

  _clearTmpFile() {
    logMsg('Clear tmp file ...')
    return new Promise((resolve, reject) => {
      fs.remove(this.tmp, err => {
        if (err) {
          log.error(err)
        }
        log.info('clear tmp file')
        resolve()
      })
    })
  }

  _translate(text) {
    if (this.translate) {
      return opencc.simplifiedToTraditional(text);
    }
    return text;
  }

}
