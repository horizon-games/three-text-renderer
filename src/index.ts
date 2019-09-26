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

    const utf8Encoder = new TextEncoder()
    const myFont = this.fonts.get(options.fontFace)!
    const fontBlob = await fetch(myFont.path).then(x => x.arrayBuffer())

    const result = getTextShaping(text, fontBlob)

    console.log(result)
  }
}

export default TextRenderer
