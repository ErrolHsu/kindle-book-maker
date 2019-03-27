'use strict'

import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import * as path from 'path'
import * as log from 'electron-log'
import moment from 'moment-timezone'
import { format as formatUrl } from 'url'
import opencc  from 'node-opencc';
import init from './init'
import BookMaker from './book_maker/index'

log.transports.file.level = 'info';
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s} {z}] [{level}] {text}';
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s} {z}] [{level}] {text}';
log.transports.file.file = path.join(`${app.getPath('logs')}/${currentDate()}.txt`);
const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

// date
function currentDate() {
  return moment().tz('Asia/Taipei').format('YYYY-MM-DD');
}

function createMainWindow() {
  if (process.platform === 'darwin') {
    const template = [
      {
        label: "Application",
        submenu: [
          { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
        ]
      },
      {
        label: "Edit",
        submenu: [
          { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
          { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
          { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
          { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' },
        ]
      }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  } else {
    Menu.setApplicationMenu(null)
  }
  const window = new BrowserWindow({ width: 800, height: 400 })

  if (isDevelopment) {
    // window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })
  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  init().then(() => {
    mainWindow = createMainWindow()
    log.info('Hello, log');
  })
})

ipcMain.on('fetch-book', async (event, arg) => {
  // const book = new BookMaker(arg.targetUrl)
  const bookInfo = await BookMaker.fetch(arg.targetUrl)
  event.sender.send('fetch-book-reply', bookInfo)
  log.info(bookInfo)
});

ipcMain.on('generate-book', async (event, arg) => {
  const { targetPageUrl, bookName, author } = arg;
  const book = new BookMaker(targetPageUrl, bookName, author )
  book.build().catch(err => {
    log.error(err)
  })
  console.log('DONE~')
})

ipcMain.on('test', (event, arg) => {
  const converted = opencc.simplifiedToTraditional()
  console.log(converted);
});
