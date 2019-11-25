import { Font } from './lib/raqm'

export default class FontLoader {
  key: string
  path: string

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

  async load() {
    try {
      const fontBuffer = await fetch(this.path).then(x => x.arrayBuffer())
      this._font = new Font(fontBuffer)
      this._isLoaded = true
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

    return this.font
  }
}
