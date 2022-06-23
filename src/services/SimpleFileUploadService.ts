import {nanoid} from 'nanoid'
import App from '../App'

const path = require('path');

const fs = require('fs')
const util = require('util')
const {pipeline} = require('stream')
const pump = util.promisify(pipeline)


export function getFileExt(name: string): string {
  return name.split('.').pop().toLowerCase()
}

/**
 * handles file uploads to file system
 */
export class SimpleFileUploadService {
  protected app: App

  constructor(app: App) {
    this.app = app
  }

  async upload(fileName: string, fileData) {
    const ext = getFileExt(fileName);
    const uid = nanoid(32);

    const storeFileName = `${uid}.${ext}`;
    const fullName = `${path.join(this.app.env.srcPath, '..')}/static/uploads/${storeFileName}`;
    await pump(fileData, fs.createWriteStream(fullName));

    return {
      file: {
        name: storeFileName,
        uid,
        ext,
      },
    }
  }

}
