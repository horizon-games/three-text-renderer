import { Glyph, Path } from 'opentype.js'
import { BufferAttribute, BufferGeometry, Texture } from 'three'

import FontLoader from './FontLoader'
import { getTextShaping, Shaping } from './lib/raqm'
import { TextAlign, TextOptions } from './TextOptions'

interface ShapedGlyph {
  glyph: Glyph
  shaping: Shaping
}

export interface Line {
  glyphs: ShapedGlyph[]
  width: number
  height: number
}

interface TextRendererOptions {}

const BREAK_POINT_SYMBOLS = [' ', ',']
const WHITE_SPACE = [' ']

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

  async getShapedGlyphs(text: string, options: TextOptions): Promise<Line[]> {
    const {
      blob,
      font: { glyphs, unitsPerEm }
    } = await this.useFont(options.fontFace)
    const textLines = splitLines(text)
    const { letterSpacing } = options

    return textLines.map(text => {
      const textShaping = getTextShaping(
        text,
        blob,
        options.lang,
        options.direction
      )

      if (letterSpacing) {
        // Apply letter spacing to xAdvance - is this the best place for this?
        textShaping.forEach(glyph => {
          glyph.xAdvance += letterSpacing * unitsPerEm
        })
      }

      return {
        glyphs: textShaping.map(x => ({
          glyph: glyphs.get(x.glyphId),
          shaping: x
        })),
        width: 0,
        height: 0
      }
    })
  }

  async getTextContours(text: string, options: TextOptions): Promise<Path[][]> {
    const { font } = await this.useFont(options.fontFace)
    const lines: Line[] = await this.getShapedGlyphs(text, options)

    this._formatLines(lines, options)

    const maxLineWidth = lines.reduce((acc, line) => {
      return Math.max(acc, line.width)
    }, 0)

    return lines.reduce<Path[][]>((acc, line) => {
      let x = 0
      let y = 0
      const fontSize = options.fontSize || 72
      const fontScale = (1 / font.unitsPerEm) * fontSize
      const paths: Path[] = []

      const alignXOffset = (function() {
        switch (options.align) {
          case TextAlign.Right:
            return options.maxWidth
              ? options.maxWidth - line.width
              : maxLineWidth - line.width

          case TextAlign.Center:
            return options.maxWidth
              ? options.maxWidth / 2 - line.width / 2
              : maxLineWidth / 2 - line.width / 2

          case TextAlign.Left:
            return 0
        }

        return 0
      })()

      line.glyphs.forEach(({ glyph, shaping }) => {
        const glyphPath = glyph.getPath(
          x + shaping.xOffset * fontScale + alignXOffset,
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
    const { font } = await this.useFont(options.fontFace)
    const { ascender, unitsPerEm } = font
    const fontSize = options.fontSize || 72
    const fontScale = (1 / unitsPerEm) * fontSize
    const lineHeight = ascender * fontScale
    const geometry = new BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []

    const lines = await this.getTextContours(text, options)

    /// -------------------------------------------------------------
    // XXX: Hey Tom, this is where you can process these glyph lines.
    // --------------------------------------------------------------

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

    // TODO use letterSpacing property as well to calculate line widths

    if (maxWidth || maxHeight) {
      let lineIdx = 0

      while (lineIdx < lines.length) {
        const line = lines[lineIdx]
        const breakPoints = []
        let x = 0
        let y = 0

        if (line.glyphs.length > 1) {
          for (let glyphIdx = 0; glyphIdx < line.glyphs.length; glyphIdx++) {
            const { shaping } = line.glyphs[glyphIdx]
            if (BREAK_POINT_SYMBOLS.includes(shaping.symbol)) {
              breakPoints.push({ x, glyphIdx })
            }

            if (shaping.xAdvance) {
              let breakPoint = { x, glyphIdx }

              x += shaping.xAdvance * fontScale

              if (maxWidth && x > maxWidth) {
                if (breakPoints.length) {
                  breakPoint = breakPoints.pop()!
                  const breakPointGlyph = line.glyphs[breakPoint.glyphIdx]

                  if (WHITE_SPACE.includes(breakPointGlyph.shaping.symbol)) {
                    line.glyphs.splice(breakPoint.glyphIdx, 1)
                  } else if (
                    breakPoint.x +
                      breakPointGlyph.shaping.xAdvance * fontScale <=
                    maxWidth
                  ) {
                    // Increase breakpoint index to take within this line
                    breakPoint.glyphIdx++
                  }
                }

                if (breakPoint.glyphIdx > 0) {
                  const nextLineGlyphs = line.glyphs.splice(
                    breakPoint.glyphIdx,
                    line.glyphs.length - breakPoint.glyphIdx
                  )
                  const nextLine: Line = {
                    glyphs: nextLineGlyphs,
                    width: 0,
                    height: 0
                  }

                  line.width = breakPoint.x
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

        line.width = this._getLineWidth(line, options)
        lineIdx++
      }
    }
  }

  private _getLineWidth(line: Line, options: TextOptions): number {
    const { font } = this.getFont(options.fontFace)
    const fontSize = options.fontSize
    const fontScale = (1 / font.unitsPerEm) * fontSize

    return line.glyphs.reduce((acc, { shaping }) => {
      if (shaping.xAdvance) {
        acc += shaping.xAdvance * fontScale
      }
      return acc
    }, 0)
  }
}

// Split text on line breaks
const LINE_BREAK_REGEXP = /\r?\n/
const splitLines = (text: string): string[] => {
  return text.trim().split(LINE_BREAK_REGEXP)
}

export default TextRenderer
