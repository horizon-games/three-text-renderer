import Font from './Font'
import { TextOptions } from './TextOptions'
import { Texture, BufferGeometry, BufferAttribute } from 'three'
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

  async createTextGeometry(text: string, options: TextOptions) {
    if (!options.fontFace || !this.fonts.has(options.fontFace)) {
      throw new Error(
        `TextRenderer: Font face ${options.fontFace} is not added.`
      )
    }

    const paths = await this.getTextContours(text, options)

    const geometry = new BufferGeometry()

    const boundingBoxes = paths.map(path => path.getBoundingBox())

    const vertices: number[] = []
    const indices: number[] = []

    console.log(boundingBoxes)
    boundingBoxes.forEach((bb, idx) => {
      vertices.push(
        bb.x1,
        bb.y2,
        0,
        bb.x1,
        bb.y1,
        0,
        bb.x2,
        bb.y1,
        0,
        bb.x2,
        bb.y2,
        0
      )
      const faceIdx = idx * 4
      indices.push(faceIdx + 0, faceIdx + 1, faceIdx + 2)
      indices.push(faceIdx + 0, faceIdx + 2, faceIdx + 3)
    })

    console.log(vertices)
    console.log(indices)

    geometry.addAttribute(
      'position',
      new BufferAttribute(new Float32Array(vertices), 3)
    )
    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1))

    return geometry
  }

  async getTextContours(text: string, options: TextOptions) {
    if (!options.fontFace || !this.fonts.has(options.fontFace)) {
      throw new Error(
        `TextRenderer: Font face ${options.fontFace} is not added.`
      )
    }

    const fontFace = this.fonts.get(options.fontFace)!

    const { blob, font } = await fontFace.use()
    const { glyphs } = font
    const shapingData = getTextShaping(
      text,
      blob,
      options.lang,
      options.direction
    )

    console.log('shaping:', shapingData)

    interface GlyphShaping {
      glyph: opentype.Glyph
      shaping: {
        glyphId: number
        xAdvance: number
        yAdvance: number
        xOffset: number
        yOffset: number
      }
    }

    const textGlyphs = shapingData.reduce<GlyphShaping[]>((acc, x) => {
      acc.push({ glyph: glyphs.get(x.glyphId), shaping: x })
      return acc
    }, [])

    console.log(textGlyphs.map(x => x.glyph.name).join(''))

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
    let y = 0
    const fontSize = options.fontSize || 72
    const fontScale = (1 / font.unitsPerEm) * fontSize
    const paths: opentype.Path[] = []
    textGlyphs.forEach(({ glyph, shaping }) => {
      // x += shaping.x_offset * fontScale
      // y += shaping.y_offset * fontScale

      const glyphPath = glyph.getPath(
        x + shaping.xOffset * fontScale,
        y + shaping.yOffset * fontScale,
        fontSize,
        {},
        font
      )
      paths.push(glyphPath)

      if (shaping.xAdvance) {
        x += shaping.xAdvance * fontScale
      }

      if (shaping.yAdvance) {
        y += shaping.yAdvance * fontScale
      }
    })

    console.log('final x width:', x)

    return paths
  }
}

export default TextRenderer
