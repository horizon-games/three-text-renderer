import Font from './Font'
import { TextOptions } from './TextOptions'
import { Texture } from 'three'
import { getTextShaping } from './lib/raqm'
import * as opentype from 'opentype.js'

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
  }

  async getTextContours(text: string, options: Partial<TextOptions> = {}) {
    if (!options.fontFace || !this.fonts.has(options.fontFace)) {
      throw new Error(
        `TextRenderer: Font face ${options.fontFace} is not added.`
      )
    }

    const fontFace = this.fonts.get(options.fontFace)!

    const { blob, font } = await fontFace.use()
    const { glyphs } = font
    const shapingData = getTextShaping(text, blob)

    console.log(shapingData)

    const textGlyphs = shapingData.reduce<Array<opentype.Glyph>>((acc, x) => {
      acc.push(glyphs.get(x.g))
      return acc
    }, [])
    console.log(textGlyphs)

    console.log(textGlyphs.map(x => x.name).join(''))

    // // get glyph paths
    // const glyphPaths: opentype.Path[] = []
    // let gX = 0
    // let gY = 0
    // textGlyphs.forEach(glyph => {
    //   const glyphPath = glyph.getPath(gX, gY, fontSize, {}, font)
    //   glyphPaths.push(glyphPath)

    //   gX += glyph.advanceWidth
    // })

    let x = 0
    let y = 150
    const fontSize = 72
    const fontScale = (1 / font.unitsPerEm) * fontSize
    const paths: opentype.Path[] = []
    textGlyphs.forEach(glyph => {
      const glyphPath = glyph.getPath(x, y, fontSize, {}, font)
      paths.push(glyphPath)
      //fullPath.extend(glyphPath)

      if (glyph.advanceWidth) {
        x += glyph.advanceWidth * fontScale
      }
    })

    console.log('x width', x)

    return paths
  }
}

export default TextRenderer
