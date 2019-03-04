const fs = require('fs');
const readline = require('readline');
const { ncp } = require('ncp');
const JSZip = require('jszip')



function xxx() {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", {compression: "STORE"});
  zip.folder("META-INF").file('container.xml', fs.readFileSync('/Users/errol/Ebook/修真聊天群/META-INF/container.xml'), {compression: "DEFLATE"})
  zip.folder("OEBPS").file('1.xhtml', fs.readFileSync('/Users/errol/Ebook/修真聊天群/OEBPS/1.xhtml'), {compression: "DEFLATE"})
  zip.folder("OEBPS").file('2.xhtml', fs.readFileSync('/Users/errol/Ebook/修真聊天群/OEBPS/2.xhtml'), {compression: "DEFLATE"})
  zip.folder("OEBPS").file('3.xhtml', fs.readFileSync('/Users/errol/Ebook/修真聊天群/OEBPS/3.xhtml'), {compression: "DEFLATE"})
  zip.folder("OEBPS").file('page-template.xpgt', fs.readFileSync('/Users/errol/Ebook/修真聊天群/OEBPS/page-template.xpgt'), {compression: "DEFLATE"})
  zip.folder("OEBPS").file('content.opf', fs.readFileSync('/Users/errol/Ebook/修真聊天群/OEBPS/content.opf'), {compression: "DEFLATE"})
  zip.folder("OEBPS").file('stylesheet.css', fs.readFileSync('/Users/errol/Ebook/修真聊天群/OEBPS/stylesheet.css'), {compression: "DEFLATE"})
  zip.folder("OEBPS").file('toc.ncx', fs.readFileSync('/Users/errol/Ebook/修真聊天群/OEBPS/toc.ncx'), {compression: "DEFLATE"})

  zip.generateAsync({type:"nodebuffer"}).then(function(content) {
    fs.writeFile("/Users/errol/Ebook/xxx.epub", content, function(err){/*...*/});
  });
}

xxx()
// processLineByLine();
