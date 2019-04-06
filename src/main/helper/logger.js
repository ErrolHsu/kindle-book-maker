import * as log from 'electron-log'
import { BrowserWindow } from 'electron'

function logMsg(data) {
  const win = BrowserWindow.getAllWindows()[0];
  log.info(data)
  win.webContents.send('msg', data);
}

export { logMsg }
