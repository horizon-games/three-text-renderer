import Font from './Font'
import { TextOptions } from './TextOptions'
import { Texture } from 'three'
import { getTextShaping } from './lib/raqm'

interface TextRendererOptions {}

class TextRenderer {
  fonts: Map<string, Font> = new Map()
  texture: Texture
  options: TextRendererOptions = {}
  raqm: WebAssembly.WebAssemblyInstantiatedSource | undefined

  constructor(options: Partial<TextRendererOptions> = {}) {
    Object.assign(this.options, options)

    this.texture = new Texture()
  }

  addFont(key: string, path: string) {
    this.fonts.set(key, new Font(key, path))
  }

  removeFont(key: string) {
    this.fonts.delete(key)
  }

  async createTextGeometry(text: string, options: Partial<TextOptions> = {}) {
    if (!options.fontFace || !this.fonts.has(options.fontFace)) {
      throw new Error(
        `TextRenderer: Font face ${options.fontFace} is not added.`
      )
    }

    const font = this.fonts.get(options.fontFace)!

    const { blob } = await font.use()

    const shapingData = getTextShaping(text, blob)

    console.log(shapingData)
  }
}

export default TextRenderer
