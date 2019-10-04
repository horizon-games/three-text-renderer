import { Glyph, Path } from 'opentype.js'
import {
  BufferAttribute,
  BufferGeometry,
  LinearEncoding,
  LinearFilter,
  RGBFormat,
  WebGLRenderTarget
} from 'three'

import FontLoader from './FontLoader'
import { getTextShaping, Shaping } from './lib/raqm'
import { TextAlign, TextOptions } from './TextOptions'

export interface ShapedGlyph {
  glyph: Glyph
  shaping: Shaping
  path: Path | undefined
}

export interface Line {
  glyphs: ShapedGlyph[]
  width: number
  height: number
}

interface TextRendererOptions {
  //
}

const BREAK_POINT_SYMBOLS = [' ', ',']
const WHITE_SPACE = [' ']

class TextRenderer {
  get texture() {
    return this._atlasTarget.texture
  }
  fonts: Map<string, FontLoader> = new Map()
  options: TextRendererOptions = {}
  raqm: WebAssembly.WebAssemblyInstantiatedSource | undefined
  private _atlasTarget: WebGLRenderTarget

  constructor(options: Partial<TextRendererOptions> = {}) {
    Object.assign(this.options, options)

    this._atlasTarget = new WebGLRenderTarget(2048, 2048, {
      format: RGBFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      generateMipmaps: false
    })
    this.texture.encoding = LinearEncoding
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
      font: { glyphs }
    } = await this.useFont(options.fontFace)
    const textLines = splitLines(text)

    return textLines.map(text => {
      const textShaping = getTextShaping(
        text,
        blob,
        options.lang,
        options.direction
      )

      return {
        glyphs: textShaping.map(x => ({
          glyph: glyphs.get(x.glyphId),
          shaping: x,
          path: undefined
        })),
        width: 0,
        height: 0
      }
    })
  }

  async getTextContours(text: string, options: TextOptions): Promise<Line[]> {
    const { font } = await this.useFont(options.fontFace)
    const lines: Line[] = await this.getShapedGlyphs(text, options)

    this._formatLines(lines, options)

    // Add Path contours to lines
    lines.forEach(line => {
      const fontSize = options.fontSize

      line.glyphs.forEach(shapedGlyph => {
        shapedGlyph.path = shapedGlyph.glyph.getPath(0, 0, fontSize, {}, font)
      })
    })

    return lines
  }

  async createTextGeometry(text: string, options: TextOptions) {
    const { font } = await this.useFont(options.fontFace)
    const { ascender, unitsPerEm } = font
    const { fontSize, letterSpacing, maxWidth, align } = options
    const fontScale = (1 / unitsPerEm) * fontSize
    const lineHeight = ascender * fontScale
    const geometry = new BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []

    const lines = await this.getTextContours(text, options)

    /// -------------------------------------------------------------
    // XXX: Hey Tom, this is where you can process these glyph lines.
    // --------------------------------------------------------------

    const maxLineWidth = lines.reduce((acc, line) => {
      return Math.max(acc, line.width)
    }, 0)

    let xAdvance = 0
    let yAdvance = 0
    let currIdx = 0

    lines.forEach(line => {
      const xAlignOffset = (function() {
        switch (align) {
          case TextAlign.Right:
            return maxWidth ? maxWidth - line.width : maxLineWidth - line.width

          case TextAlign.Center:
            return maxWidth
              ? maxWidth / 2 - line.width / 2
              : maxLineWidth / 2 - line.width / 2

          case TextAlign.Left:
            return 0
        }

        return 0
      })()

      const z = 0

      line.glyphs.forEach((shapedGlyph, idx) => {
        const { shaping, path } = shapedGlyph
        const bb = path!.getBoundingBox()
        const faceIdx = currIdx + idx * 4
        const xOffset = shaping.xOffset * fontScale + xAlignOffset
        const yOffset = shaping.yOffset * fontScale

        vertices.push(
          bb.x1 + xAdvance + xOffset,
          bb.y2 + yAdvance + yOffset,
          z,
          bb.x1 + xAdvance + xOffset,
          bb.y1 + yAdvance + yOffset,
          z,
          bb.x2 + xAdvance + xOffset,
          bb.y1 + yAdvance + yOffset,
          z,
          bb.x2 + xAdvance + xOffset,
          bb.y2 + yAdvance + yOffset,
          z
        )

        indices.push(faceIdx + 0, faceIdx + 1, faceIdx + 2)
        indices.push(faceIdx + 0, faceIdx + 2, faceIdx + 3)

        xAdvance += shaping.xAdvance * fontScale

        if (letterSpacing) {
          xAdvance += letterSpacing * unitsPerEm * fontScale
        }

        yAdvance += shaping.yAdvance * fontScale
      })

      currIdx += line.glyphs.length * 4

      // TODO support xOffsets for TTB direction
      xAdvance = 0
      yAdvance += lineHeight
    })

    geometry.addAttribute(
      'position',
      new BufferAttribute(new Float32Array(vertices), 3)
    )
    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1))
    geometry.computeBoundingBox()

    return geometry
  }

  private _formatLines(lines: Line[], options: TextOptions) {
    const { font } = this.getFont(options.fontFace)
    const { unitsPerEm } = font
    const { fontSize, letterSpacing } = options
    const fontScale = (1 / unitsPerEm) * fontSize
    const { maxWidth, maxHeight } = options

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

              // Include letterSpacing in line-measurement
              if (letterSpacing) {
                x += letterSpacing * unitsPerEm * fontScale
              }

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
    const { unitsPerEm } = font
    const { fontSize, letterSpacing } = options
    const fontScale = (1 / font.unitsPerEm) * fontSize

    return line.glyphs.reduce((acc, { shaping }) => {
      acc += shaping.xAdvance * fontScale

      // Include letterSpacing in line-measurement
      if (letterSpacing) {
        acc += letterSpacing * unitsPerEm * fontScale
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
