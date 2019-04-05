import { app } from 'electron'
import * as path from 'path'

const EXTRA_FILES_PATH = path.join(app.getAppPath(), '../../', 'extra_files')
const BIN_PATH = app.isPackaged ? path.join(EXTRA_FILES_PATH, 'bin') : path.resolve(__dirname, '../../../', 'bin')

export { BIN_PATH, EXTRA_FILES_PATH }
