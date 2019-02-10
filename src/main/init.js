import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { config, updateConfig } from './config'

async function init() {
  const userDataPath = path.join(app.getPath('userData'));
  const configFilePath = path.join(userDataPath, 'application.json');

  await initFolder(userDataPath);
  await checkConfigFile(configFilePath);
  // load & valid config
  config.loadFile(configFilePath);
  config.validate({ allowed: 'warn' });
  updateConfig();
}

function initFolder(pathName) {
  return new Promise((resolve, reject) => {
    fs.access(pathName, (err) => {
      // err表示無此目錄
      if (err) {
        fs.mkdir(pathName, (error) => {
          if (error) return reject(error);
          return resolve();
        });
      } else {
        return resolve();
      }
    });
  });
}

// 若沒有config file，新增一個
function checkConfigFile(configFilePath) {
  return new Promise((resolve, reject) => {
    fs.access(configFilePath, (err) => {
      // err表示無此檔案
      if (err) {
        const configuration = {};
        const json = JSON.stringify(configuration, null, 2);
        fs.writeFile(configFilePath, json, 'utf8', (error) => {
          if (error) return reject(error);
          return resolve();
        });
      } else {
        return resolve();
      }
    });
  });
}

export default init;