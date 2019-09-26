import * as opentype from 'opentype.js'

class Font {
  key: string
  path: string

  private _blob: ArrayBuffer | undefined
  private _font: opentype.Font | undefined
  private _loader: Promise<opentype.Font> | undefined

  constructor(key: string, path: string) {
    this.key = key
    this.path = path
  }

  async load() {
    try {
      this._font = await new Promise(async (resolve, reject) => {
        this._blob = await fetch(this.path).then(x => x.arrayBuffer())

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

    console.log(this._font!.glyphs)

    return this._font as opentype.Font
  }

  async use() {
    if (!this._loader) {
      this._loader = this.load()
    }

    await this._loader

    return { blob: this._blob!, font: this._font! }
  }
}

export default Font
