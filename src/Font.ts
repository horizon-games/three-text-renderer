import * as opentype from 'opentype.js'

class Font {
  key: string
  path: string

  private _font: opentype.Font | undefined
  private _loader: Promise<opentype.Font> | undefined

  constructor(key: string, path: string) {
    this.key = key
    this.path = path
  }

  async load() {
    try {
      this._font = await new Promise((resolve, reject) => {
        opentype.load(this.path, (err, font) => {
          if (err) {
            reject('Font could not be loaded: ' + err)
          } else {
            resolve(font)
          }
        })
      })
    } catch (err) {
      throw new Error(err)
    }

    return this._font as opentype.Font
  }

  async use() {
    if (!this._loader) {
      this._loader = this.load()
    }

    const font = await this._loader

    return font
  }
}

export default Font
