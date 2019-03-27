import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as log from 'electron-log'
import mkdirp from 'mkdirp'
import { ncp } from 'ncp'
import JSZip from 'jszip'
import uuidv4 from 'uuid/v4';
import opencc  from 'node-opencc';
import { spawn } from 'child_process'

const kindlegen = app.isPackaged ? path.join(app.getAppPath(), '../../', 'extra_files/bin/kindlegen') : path.resolve(__dirname, '../../../', 'bin/kindlegen')
const scaffoldPath = app.isPackaged ? path.join(app.getAppPath(), '../../', 'extra_files/scaffold') : path.resolve(__dirname, 'scaffold')
const templatePath = app.isPackaged ? path.join(app.getAppPath(), '../../', 'extra_files/template') : path.resolve(__dirname, 'template')
const outputPath = path.resolve(app.getPath('downloads'), 'kindle-book')

export default class Epub {
  constructor(name, author, translate  = true, output = outputPath) {
    this.translate = translate
    this.name = this._translate(name)
    this.author = this._translate(author)
    this.output = path.resolve(output, this.name)
    this.uuid = uuidv4();
    this.chapters = []
  }

  init() {
    return new Promise((resolve, reject) => {
      mkdirp.sync(this.output)
      ncp(scaffoldPath, this.output, function (err) {
        if (err) {
          throw new Error(err)
        }
        log.info('init done!');
        resolve()
       });
    })
  }

  addChapter(chapterNumber, title, content) {
    const chapterTemplatePath = path.resolve(templatePath, 'chapter.xhtml')
    return new Promise((resolve, reject) => {
      const chapterOutputPath = path.resolve(this.output, 'OEBPS', `${chapterNumber}.xhtml`)
      let xhtml = fs.readFileSync(chapterTemplatePath, 'utf8')
                      .replace(/{{title}}/, `${title}`)
                      .replace(/{{contentTitle}}/, `<h2>${title}</h2><br /><br />`)
                      .replace(/{{body}}/, `<div>${content}</div>`)
                      .replace(/<br>/g, '<br \/>')

      this.chapters.push({
        title: this._translate(title),
        chapterNumber,
        chapterOutputPath
      })
      // 繁簡轉換
      xhtml = this._translate(xhtml)
      fs.writeFile(chapterOutputPath, xhtml, (err) => {
        return resolve()
      });
    })
  }

  createContentOpf() {
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
      newContent = newContent.replace(/{{uuid}}/, this.uuid)
      newContent = newContent.replace(/{{manifest}}/, manifest)
      newContent = newContent.replace(/{{spine}}/, spine)

      const targetPath = path.resolve(this.output, 'OEBPS/content.opf')
      fs.writeFile(targetPath, newContent, (err) => {
        return resolve()
      });
    })
  }

  createToc() {
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

      const targetPath = path.resolve(this.output, 'OEBPS/toc.ncx')
      fs.writeFile(targetPath, newContent, (err) => {
        return resolve()
      });
    })
  }

  zip() {
    return new Promise((resolve, reject) => {
      const zip = new JSZip();
      const output = this.output
      const name = this.name
      zip.file("mimetype", fs.readFileSync(`${output}/mimetype`), {compression: "STORE"});
      zip.folder("META-INF").file('container.xml', fs.readFileSync(`${output}/META-INF/container.xml`), {compression: "DEFLATE"})
      zip.folder("OEBPS").file('page-template.xpgt', fs.readFileSync(`${output}/OEBPS/page-template.xpgt`), {compression: "DEFLATE"})
      zip.folder("OEBPS").file('content.opf', fs.readFileSync(`${output}/OEBPS/content.opf`), {compression: "DEFLATE"})
      zip.folder("OEBPS").file('stylesheet.css', fs.readFileSync(`${output}/OEBPS/stylesheet.css`), {compression: "DEFLATE"})
      zip.folder("OEBPS").file('toc.ncx', fs.readFileSync(`${output}/OEBPS/toc.ncx`), {compression: "DEFLATE"})

      for (let chapter of this.chapters) {
        zip.folder("OEBPS").file(`${chapter.chapterNumber}.xhtml`, fs.readFileSync(`${output}/OEBPS/${chapter.chapterNumber}.xhtml`), {compression: "DEFLATE"})
      }

      zip.generateAsync({type:"nodebuffer"}).then(function(content) {
        fs.writeFile(`${output}/${name}.epub`, content, function(err) {
          resolve()
        });
      });

    })
  }

  toMobi() {
    return new Promise((resolve, reject) => {
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

  _translate(text) {
    if (this.translate) {
      return opencc.simplifiedToTraditional(text);
    }

    return text;
  }

}
