import * as convict from 'convict'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'

const configFilePath = path.join(app.getPath('userData'), 'application.json');

// application.json schema
const config = convict({
  // mail
  mail: {
    service: {
      format: String,
      default: 'Gmail',
    },
    user: {
      format: String,
      default: 'N/A',
    },
    password: {
      format: String,
      default: 'N/A',
    },
  }
});

function updateConfig(object = {}) {
  config.load(object);
  const configJson = JSON.stringify(config.getProperties(), null, 2);
  fs.writeFileSync(configFilePath, configJson, 'utf8');
  // app.emit('notice-to-render-process', 'update-config', config.getProperties());
}

export { config, updateConfig }; 
