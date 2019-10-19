import { Font, Glyph, Path } from 'opentype.js'
import { BufferAttribute, BufferGeometry, WebGLRenderer } from 'three'

import FontLoader from './FontLoader'
import { getTextShaping, Shaping } from './lib/raqm'
import { TextAlign, TextOptions } from './TextOptions'
import { ISDFKit } from './three/msdf/ISDFKit'
import MSDFKit from './three/msdf/MSDFKit'
import SDFKit from './three/msdf/SDFKit'
import SDFAtlas from './three/SDFAtlas'

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
  atlas?: SDFAtlas
  atlasSize: number
  sdfMode: 'sdf' | 'msdf'
}

const BREAK_POINT_SYMBOLS = [' ', ',']
const WHITE_SPACE = [' ']

function makeISDFKit(
  mode: 'sdf' | 'msdf',
  width: number,
  height: number
): ISDFKit {
  if (mode === 'sdf') {
    return new SDFKit(width, height)
  } else {
    return new MSDFKit(width, height)
  }
}

class TextRenderer {
  get texture() {
    return this._atlas.texture
  }
  fonts: Map<string, FontLoader> = new Map()
  options: TextRendererOptions = {
    atlasSize: 1024,
    sdfMode: 'sdf'
  }

  private _atlas: SDFAtlas

  constructor(options: Partial<TextRendererOptions> = {}) {
    Object.assign(this.options, options)
    this._atlas =
      this.options.atlas ||
      new SDFAtlas(
        this.options.atlasSize,
        1,
        makeISDFKit(this.options.sdfMode, 64, 64)
      )
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

  async getTextContours(
    text: string,
    options: TextOptions,
    layout: boolean = false
  ): Promise<Line[]> {
    const { font } = await this.useFont(options.fontFace)
    const lines: Line[] = await this.getShapedGlyphs(text, options)

    this._formatLines(lines, options)

    const layoutEngine = new LayoutEngine(lines, options, font)

    // Add path contours to lines
    lines.forEach(line => {
      const fontSize = options.fontSize

      line.glyphs.forEach(shapedGlyph => {
        const [x, y] = layout ? layoutEngine.next() : [0, 0]

        shapedGlyph.path = shapedGlyph.glyph.getPath(x, y, fontSize, {}, font)
      })
    })

    return lines
  }

  async createTextGeometry(text: string, options: TextOptions) {
    const { font } = await this.useFont(options.fontFace)
    const geometry = new BufferGeometry()
    const vertices: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    const lines = await this.getTextContours(text, options)

    const layoutEngine = new LayoutEngine(lines, options, font)

    let currIdx = 0

    lines.forEach(line => {
      const z = 0

      line.glyphs.forEach((shapedGlyph, idx) => {
        const faceIdx = currIdx + idx * 4
        const { path } = shapedGlyph
        const bb = path!.getBoundingBox()
        const [xOffset, yOffset] = layoutEngine.next()
        const padding = 6
        const glyphUvs = this._atlas.addTtfGlyph(
          font.getEnglishName('fullName'),
          shapedGlyph,
          options.fontSize,
          padding,
          options.yDir
        )

        vertices.push(
          bb.x1 + xOffset - padding,
          bb.y2 + yOffset + padding,
          z,
          bb.x1 + xOffset - padding,
          bb.y1 + yOffset - padding,
          z,
          bb.x2 + xOffset + padding,
          bb.y1 + yOffset - padding,
          z,
          bb.x2 + xOffset + padding,
          bb.y2 + yOffset + padding,
          z
        )

        for (const v of glyphUvs) {
          uvs.push(v)
        }

        indices.push(faceIdx + 0, faceIdx + 1, faceIdx + 2)
        indices.push(faceIdx + 0, faceIdx + 2, faceIdx + 3)
      })

      currIdx += line.glyphs.length * 4
    })

    geometry.addAttribute(
      'position',
      new BufferAttribute(new Float32Array(vertices), 3)
    )
    geometry.addAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1))
    geometry.computeBoundingBox()

    return geometry
  }
  render(renderer: WebGLRenderer) {
    this._atlas.render(renderer)
  }
  getRawPreviewMesh() {
    return this._atlas.getRawPreviewMesh()
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

class LayoutEngine {
  lines: Line[]
  options: TextOptions
  font: Font
  maxLineWidth: number

  private _lineIdx: number = -1
  private _glyphIdx: number = 0

  private _xAdvance: number = 0
  private _yAdvance: number = 0

  constructor(lines: Line[], options: TextOptions, font: Font) {
    this.font = font
    this.lines = lines
    this.options = options

    this.maxLineWidth = lines.reduce((acc, line) => {
      return Math.max(acc, line.width)
    }, 0)

    this._nextLine()
  }

  next() {
    const line = this.lines[this._lineIdx]
    const glyph = line.glyphs[this._glyphIdx++]
    const { unitsPerEm } = this.font
    const { fontSize, letterSpacing } = this.options
    const fontScale = (1 / unitsPerEm) * fontSize

    const x = this._xAdvance + glyph.shaping.xOffset * fontScale
    const y = this._yAdvance + glyph.shaping.yOffset * fontScale

    this._xAdvance += glyph.shaping.xAdvance * fontScale
    this._yAdvance += glyph.shaping.yAdvance * fontScale

    if (letterSpacing) {
      this._xAdvance += letterSpacing * unitsPerEm * fontScale
    }

    if (
      this._glyphIdx === line.glyphs.length &&
      this._lineIdx < this.lines.length - 1
    ) {
      this._nextLine()
    }

    return [x, y]
  }

  private _nextLine() {
    const line = this.lines[++this._lineIdx]

    if (!line) {
      throw new Error(`LayoutEngine: Exceeded line length: ${this._lineIdx}`)
    }

    const { ascender, unitsPerEm } = this.font
    const { fontSize, maxWidth, align } = this.options
    const fontScale = (1 / unitsPerEm) * fontSize
    const lineHeight = ascender * fontScale * (this.options.lineHeight || 1)

    this._glyphIdx = 0

    const xAlignOffset = (() => {
      switch (align) {
        case TextAlign.Right:
          return maxWidth
            ? maxWidth - line.width
            : this.maxLineWidth - line.width

        case TextAlign.Center:
          return maxWidth
            ? maxWidth / 2 - line.width / 2
            : this.maxLineWidth / 2 - line.width / 2

        case TextAlign.Left:
          return 0
      }

      return 0
    })()

    this._xAdvance = xAlignOffset
    this._yAdvance += lineHeight
  }
}

// Split text on line breaks
const LINE_BREAK_REGEXP = /\r?\n/
const splitLines = (text: string): string[] => {
  return text.trim().split(LINE_BREAK_REGEXP)
}

export default TextRenderer
