import * as log from 'electron-log'
import { BrowserWindow } from 'electron'

function logMsg(data) {
  const win = BrowserWindow.getAllWindows()[0];
  log.info(data)
  if (win) {
    win.webContents.send('msg', data);
  }
}

function loading() {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send('loading');
  }
}

function alertSuccess(data) {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send('alert-success', data);
  }
}

function alertError(data) {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send('alert-error', data);
  }
}

export { logMsg, alertSuccess, alertError, loading }
