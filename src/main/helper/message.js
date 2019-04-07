import * as log from 'electron-log'
import { BrowserWindow } from 'electron'

function logMsg(data) {
  const win = BrowserWindow.getAllWindows()[0];
  log.info(data)
  win.webContents.send('msg', data);
}

function alertSuccess(data) {
  win.webContents.send('alert-success', data);
}

function alertError(data) {
  console.log(data)
  // win.webContents.send('alert-error', data);
}

export { logMsg, alertSuccess, alertError }
