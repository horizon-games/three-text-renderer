import { Font, load } from 'opentype.js'

export default class FontLoader {
  key: string
  path: string

  private _blob: ArrayBuffer | undefined
  private _font: Font | undefined
  private _loader: Promise<Font> | undefined
  private _isLoaded: boolean = false

  constructor(key: string, path: string) {
    this.key = key
    this.path = path
  }

  get isLoaded(): boolean {
    return this._isLoaded
  }

  get font(): Font {
    if (!this.isLoaded) {
      throw new Error('FontLoader: Font is not yet loaded. Try `use` first')
    }

    return this._font!
  }

  get blob(): ArrayBuffer {
    if (!this.isLoaded) {
      throw new Error('FontLoader: Font is not yet loaded. Try `use` first')
    }

    return this._blob!
  }

  async load() {
    try {
      this._font = await new Promise(async (resolve, reject) => {
        this._blob = await fetch(this.path).then(x => x.arrayBuffer())

        load(this.path, (err, font) => {
          if (err) {
            reject('Font could not be loaded: ' + err)
          } else {
            this._isLoaded = true
            resolve(font)
          }
        })
      })
    } catch (err) {
      throw new Error(err)
    }

    return this.font as Font
  }

  async use() {
    if (!this._loader) {
      this._loader = this.load()
    }

    await this._loader

    return { blob: this.blob, font: this.font }
  }
}
