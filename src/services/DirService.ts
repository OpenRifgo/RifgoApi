import * as path from 'path'

export class DirService {
    protected _rootDir: string

    constructor() {
        this._rootDir = path.dirname(path.dirname(require.main.filename))
    }

    get rootDir() {
        return this._rootDir
    }
}
