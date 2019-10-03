import { Path, Glyph } from 'opentype.js'
import { BufferAttribute, BufferGeometry, Texture } from 'three'

import FontLoader from './FontLoader'
import { getTextShaping, Shaping } from './lib/raqm'
import { TextOptions } from './TextOptions'

interface GlyphShaping {
  glyph: Glyph
  shaping: Shaping
}

export type Line = GlyphShaping[]

interface TextRendererOptions {}

class TextRenderer {
  fonts: Map<string, FontLoader> = new Map()
  texture: Texture
  options: TextRendererOptions = {}
  raqm: WebAssembly.WebAssemblyInstantiatedSource | undefined

  constructor(options: Partial<TextRendererOptions> = {}) {
    Object.assign(this.options, options)

    this.texture = new Texture()
  }

  addFont(key: string, path: string) {
    this.fonts.set(key, new FontLoader(key, path))
  }

  removeFont(key: string) {
    this.fonts.delete(key)
  }

  getFont(key: string): FontLoader {
    if (!this.fonts.has(key)) {
      throw new Error(`TextRenderer: Does not contain font by ${key}`)
    }

    return this.fonts.get(key)!
  }

  // Triggers the load of the font
  async useFont(key: string) {
    return this.getFont(key).use()
  }

  async getTextShaping(
    text: string,
    options: TextOptions
  ): Promise<Shaping[][]> {
    const fontLoader = this.getFont(options.fontFace)
    const { blob } = await fontLoader.use()
    const textLines = splitLines(text)

    return textLines.reduce<Shaping[][]>((acc, text) => {
      acc.push(getTextShaping(text, blob, options.lang, options.direction))

      return acc
    }, [])
  }

  async getTextContours(text: string, options: TextOptions): Promise<Path[][]> {
    const fontLoader = this.getFont(options.fontFace)
    const { font } = await fontLoader.use()
    const { glyphs } = font
    const textShapingLines = await this.getTextShaping(text, options)

    const glyphShapingLines = textShapingLines.map(textShaping => {
      return textShaping.map(x => ({
        glyph: glyphs.get(x.glyphId),
        shaping: x
      }))
    })

    this._formatLines(glyphShapingLines, options)

    return glyphShapingLines.reduce<Path[][]>((acc, glyphShaping) => {
      let x = 0
      let y = 0
      const fontSize = options.fontSize || 72
      const fontScale = (1 / font.unitsPerEm) * fontSize
      const paths: Path[] = []

      glyphShaping.forEach(({ glyph, shaping }) => {
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

  async createTextGeometry(text: string, options: TextOptions) {
    const fontLoader = this.getFont(options.fontFace)
    const { font } = await fontLoader.use()
    const { ascender, unitsPerEm } = font
    const fontSize = options.fontSize || 72
    const fontScale = (1 / unitsPerEm) * fontSize
    const lineHeight = ascender * fontScale
    const lines = await this.getTextContours(text, options)
    const geometry = new BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []

    let currIdx = 0
    const xOffset = 0
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

    geometry.addAttribute(
      'position',
      new BufferAttribute(new Float32Array(vertices), 3)
    )
    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1))

    // TODO: Send linePaths for formatter

    geometry.computeBoundingBox()

    return geometry
  }

  private _formatLines(lines: Line[], options: TextOptions) {
    const { font } = this.getFont(options.fontFace)
    const fontSize = options.fontSize
    const fontScale = (1 / font.unitsPerEm) * fontSize
    const { maxWidth, maxHeight } = options

    if (maxWidth || maxHeight) {
      let lineIdx = 0

      while (lineIdx < lines.length) {
        const line = lines[lineIdx]
        const breakPoints = []
        let x = 0
        let y = 0

        if (line.length > 1) {
          for (let glyphIdx = 0; glyphIdx < line.length; glyphIdx++) {
            const { shaping } = line[glyphIdx]
            if (shaping.symbol === ' ') {
              breakPoints.push(glyphIdx)
            }

            if (shaping.xAdvance) {
              x += shaping.xAdvance * fontScale

              if (maxWidth && x > maxWidth) {
                const breakPoint = breakPoints.length
                  ? breakPoints.pop()! + 1
                  : glyphIdx

                if (breakPoint > 0) {
                  const nextLine = line.splice(
                    breakPoint,
                    line.length - breakPoint
                  )
                  lines.splice(lineIdx + 1, 0, nextLine)
                  break
                }
              }
            }

            if (shaping.yAdvance) {
              y += shaping.yAdvance * fontScale

              if (maxHeight && y > maxHeight) {
                // TODO handle TTB direction and max height wrapping
              }
            }
          }
        }

        lineIdx++
      }
    }
  }
}

// Split text on line breaks
const LINE_BREAK_REGEXP = /\r?\n/
const splitLines = (text: string): string[] => {
  return text.trim().split(LINE_BREAK_REGEXP)
}

export default TextRenderer
