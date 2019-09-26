import { Font, load } from 'opentype.js'

interface TextRendererOptions {}

class TextRenderer {
  font: Font | undefined
  options: TextRendererOptions = {}

  ready: Promise<any>
  private _readyResolver: any

  constructor(fontPath: string, options: Partial<TextRendererOptions> = {}) {
    Object.assign(this.options, options)

    this.ready = new Promise(resolve => {
      this._readyResolver = resolve
    })

    this.loadFont(fontPath)
  }

  async loadFont(fontPath: string) {
    load(fontPath, (err, font) => {
      if (err) {
        throw new Error('Font could not be loaded: ' + err)
      } else {
        this.font = font

        this._readyResolver()
      }
    })
  }
}

export default TextRenderer
