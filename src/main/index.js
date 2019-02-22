'use strict'

import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as log from 'electron-log'
import moment from 'moment-timezone'
import { format as formatUrl } from 'url'
import { PresetPage, call } from './test.js'
import init from './init'
import { Book } from './book_maker/book'
import { UUBook } from './book_maker/uuBook'

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
  const window = new BrowserWindow()

  if (isDevelopment) {
    window.webContents.openDevTools()
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

ipcMain.on('create-book', async (event, arg) => {
  const uubook = new UUBook(arg.targetUrl)
  await uubook.createBook();
});

ipcMain.on('test-screenshot', (event, arg) => {
  console.log('截圖')
  PresetPage();
});
