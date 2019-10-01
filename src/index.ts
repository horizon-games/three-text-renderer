import * as opentype from 'opentype.js'
import { BufferAttribute, BufferGeometry, Texture } from 'three'

import Font from './Font'
import { getTextShaping } from './lib/raqm'
import { TextOptions } from './TextOptions'

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

    const fontFace = this.fonts.get(options.fontFace)!

    const { font } = await fontFace.use()
    const { ascender, unitsPerEm } = font
    const fontSize = options.fontSize || 72
    const fontScale = (1 / unitsPerEm) * fontSize
    const lineHeight = ascender * fontScale

    console.log('lineHeight', lineHeight)
    const lines = await this.getTextContours(text, options)
    const geometry = new BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []

    let currIdx = 0
    let xOffset = 0
    let yOffset = 0

    lines.forEach(paths => {
      const boundingBoxes = paths.map(path => path.getBoundingBox())
      const z = 0

      boundingBoxes.forEach((bb, idx) => {
        const faceIdx = currIdx + idx * 4

        vertices.push(
          bb.x1 + xOffset,
          bb.y2 + yOffset,
          z,
          bb.x1 + xOffset,
          bb.y1 + yOffset,
          z,
          bb.x2 + xOffset,
          bb.y1 + yOffset,
          z,
          bb.x2 + xOffset,
          bb.y2 + yOffset,
          z
        )

        indices.push(faceIdx + 0, faceIdx + 1, faceIdx + 2)
        indices.push(faceIdx + 0, faceIdx + 2, faceIdx + 3)
      })

      currIdx += boundingBoxes.length * 4

      // TODO support xOffsets for TTB direction
      yOffset += lineHeight
    })

    console.log('currIndx', currIdx)

    console.log(vertices)
    console.log(indices)

    geometry.addAttribute(
      'position',
      new BufferAttribute(new Float32Array(vertices), 3)
    )
    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1))

    // TODO: Send linePaths for formatter

    geometry.computeBoundingBox()

    return geometry
  }

  async getTextContours(
    text: string,
    options: TextOptions
  ): Promise<Array<opentype.Path[]>> {
    if (!options.fontFace || !this.fonts.has(options.fontFace)) {
      throw new Error(
        `TextRenderer: Font face ${options.fontFace} is not added.`
      )
    }

    const fontFace = this.fonts.get(options.fontFace)!

    const { blob, font } = await fontFace.use()
    const { glyphs } = font

    const textLines = splitLines(text)
    console.log('lines:', textLines)

    return textLines.reduce<Array<opentype.Path[]>>((acc, text) => {
      const shapingData = getTextShaping(
        text,
        blob,
        options.lang,
        options.direction
      )

      console.log('shaping:', shapingData)

      const textGlyphs = shapingData.reduce<GlyphShaping[]>((acc, x) => {
        acc.push({ glyph: glyphs.get(x.glyphId), shaping: x })
        return acc
      }, [])

      console.log(textGlyphs.map(x => x.glyph.name).join(''))

      let x = 0
      let y = 0
      const fontSize = options.fontSize || 72
      const fontScale = (1 / font.unitsPerEm) * fontSize
      const paths: opentype.Path[] = []
      textGlyphs.forEach(({ glyph, shaping }) => {
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

      acc.push(paths)

      return acc
    }, [])
  }

  format(lines: any) {
    // Return formatted glyphs by line
  }
}

// Split text on line breaks
const LINE_BREAK_REGEXP = /\r?\n/
const splitLines = (text: string): string[] => {
  return text.trim().split(LINE_BREAK_REGEXP)
}

export default TextRenderer
