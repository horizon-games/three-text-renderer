import Path from '../../Path'

import raqm from './raqm.wasm'
import Types, { defineStruct } from './Types'

export interface Shaping {
  symbol: string
  glyphId: number
  xAdvance: number
  yAdvance: number
  xOffset: number
  yOffset: number
  cluster: number
  fontIndex: number
}

enum HB_MEMORY_MODE {
  HB_MEMORY_MODE_DUPLICATE,
  HB_MEMORY_MODE_READONLY,
  HB_MEMORY_MODE_WRITABLE,
  HB_MEMORY_MODE_READONLY_MAY_MAKE_WRITABLE
}

// enum RAQM_DIRECTION {
//   RAQM_DIRECTION_DEFAULT,
//   RAQM_DIRECTION_RTL,
//   RAQM_DIRECTION_LTR,
//   RAQM_DIRECTION_TTB
// }

const shapingStruct = defineStruct({
  glyphId: Types.u32,
  xAdvance: Types.u32,
  yAdvance: Types.u32,
  xOffset: Types.i32,
  yOffset: Types.i32,
  cluster: Types.u32,
  font: Types.u32
})

raqm.memory.grow(400) // each page is 64kb in size

// Memory heap views
//const heap = new DataView(raqm.memory.buffer)
const heapu8 = new Uint8Array(raqm.memory.buffer)
const heapu32 = new Uint32Array(raqm.memory.buffer)
const heapi32 = new Int32Array(raqm.memory.buffer)

const utf8Encoder = new TextEncoder()

export class Font {
  name: string
  unitsPerEm: number
  glyphCount: number
  ascender: number
  descender: number
  buffer: Uint8Array
  glyphs: Map<number, Glyph> = new Map()

  // pointers
  private _fontBufferPointer: number | null = null
  private _facePointer: number | null = null
  private _fontPointer: number | null = null

  get inMemory() {
    return (
      this._fontBufferPointer !== null &&
      this._facePointer !== null &&
      this._fontBufferPointer !== null
    )
  }

  get fontBufferPointer() {
    if (this._fontBufferPointer === null) {
      throw new Error(
        'Font: Error accessing pointer that has not been created.'
      )
    }

    return this._fontBufferPointer
  }

  get facePointer() {
    if (this._facePointer === null) {
      throw new Error(
        'Font: Error accessing pointer that has not been created.'
      )
    }

    return this._facePointer
  }

  get fontPointer() {
    if (this._fontPointer === null) {
      throw new Error(
        'Font: Error accessing pointer that has not been created.'
      )
    }

    return this._fontPointer
  }

  constructor(buffer: ArrayBuffer) {
    this.buffer = new Uint8Array(buffer)
    this.name = `${Math.random()}` // TODO can we get the font name from the file

    this.load()

    // Get font metrics
    this.glyphCount = raqm.hb_face_get_glyph_count(this.facePointer!)
    this.unitsPerEm = raqm.hb_face_get_upem(this.facePointer!)

    // Get font extents
    const fontExtents = raqm.malloc(12 * 4)

    raqm.hb_font_get_h_extents(this.fontPointer!, fontExtents)

    this.ascender = heapi32[fontExtents / 4]
    this.descender = heapi32[fontExtents / 4 + 1]

    raqm.free(fontExtents)

    this.free()
  }

  load() {
    if (!this.inMemory) {
      this._fontBufferPointer = raqm.malloc(this.buffer.byteLength)
      heapu8.set(this.buffer, this._fontBufferPointer)

      const blob = raqm.hb_blob_create(
        this._fontBufferPointer,
        this.buffer.byteLength,
        HB_MEMORY_MODE.HB_MEMORY_MODE_WRITABLE,
        0,
        0
      )

      this._facePointer = raqm.hb_face_create(blob, 0) // second parameter is ttc index

      raqm.hb_blob_destroy(blob)

      this._fontPointer = raqm.hb_font_create(this._facePointer)
    }
  }

  free() {
    raqm.hb_face_destroy(this.facePointer)
    raqm.hb_font_destroy(this.fontPointer)
    raqm.free(this.fontBufferPointer)

    this._facePointer = null
    this._fontPointer = null
    this._fontBufferPointer = null
  }
}

export class Glyph {
  id: number
  symbol: string
  path: Path

  constructor(id: number, symbol: string, path: Path) {
    this.id = id
    this.symbol = symbol
    this.path = path
  }

  getPath(
    xOffset: number = 0,
    yOffset: number = 0,
    fontSize: number = 72
  ): Path {
    const { commands } = this.path
    const scale = (1 / this.path.unitsPerEm) * fontSize
    const xScale = scale
    const yScale = scale
    const p = new Path()

    for (const cmd of commands) {
      switch (cmd.type) {
        case 'M':
          p.moveTo(xOffset + cmd.x * xScale, yOffset + -cmd.y * yScale)
          break

        case 'L':
          p.lineTo(xOffset + cmd.x * xScale, yOffset + -cmd.y * yScale)
          break

        case 'Q':
          p.quadraticCurveTo(
            xOffset + cmd.cpx * xScale,
            yOffset + -cmd.cpy * yScale,
            xOffset + cmd.x * xScale,
            yOffset + -cmd.y * yScale
          )
          break

        case 'C':
          p.bezierCurveTo(
            xOffset + cmd.cp1x * xScale,
            yOffset + -cmd.cp1y * yScale,
            xOffset + cmd.cp2x * xScale,
            yOffset + -cmd.cp2y * yScale,
            xOffset + cmd.x * xScale,
            yOffset + -cmd.y * yScale
          )
          break

        case 'Z':
          p.close()
          break
      }
    }

    return p
  }

  getBoundingBox() {
    return this.path.getBoundingBox()
  }
}

export const getGlyphPath = (font: Font, glyphId: number, symbol: string) => {
  if (!font.glyphs.has(glyphId)) {
    const glyphPathPointer = raqm.hb_ot_glyph_path_create_from_font(
      font.fontPointer,
      glyphId
    )
    const tempPointer = raqm.malloc(4)
    const coords = raqm.hb_ot_glyph_path_get_coords(
      glyphPathPointer,
      tempPointer
    )
    //const coordsCount = heapu32[tempPointer / 4]
    const commands = raqm.hb_ot_glyph_path_get_commands(
      glyphPathPointer,
      tempPointer
    )
    const commandsCount = heapu32[tempPointer / 4]
    raqm.free(tempPointer)

    const path = new Path()
    path.unitsPerEm = font.unitsPerEm

    for (let i = 0, j = coords / 4; i < commandsCount; i++) {
      const cmd = String.fromCharCode(heapu8[commands + i])

      switch (cmd) {
        case 'M': // Move
          path.moveTo(heapi32[j], heapi32[j + 1])
          j += 2
          break
        case 'L': // Line
          path.lineTo(heapi32[j], heapi32[j + 1])
          j += 2
          break

        case 'Q': // Quadatic - 1 control point curve
          path.quadraticCurveTo(
            heapi32[j + 0],
            heapi32[j + 1],
            heapi32[j + 2],
            heapi32[j + 3]
          )
          j += 4
          break

        case 'C': // Cubic curve - 2 control point curve
          path.bezierCurveTo(
            heapi32[j + 0],
            heapi32[j + 1],
            heapi32[j + 2],
            heapi32[j + 3],
            heapi32[j + 4],
            heapi32[j + 5]
          )
          j += 6
          break

        case 'Z': // End
          path.close()
          break
      }
    }

    raqm.hb_ot_glyph_path_destroy(glyphPathPointer)

    const glyph = new Glyph(glyphId, symbol, path)

    font.glyphs.set(glyphId, glyph)

    return path
  } else {
    return font.glyphs.get(glyphId)!.path
  }
}

export const getTextShaping = (
  text: string,
  font: Font,
  lang: string,
  direction: number
): Shaping[] => {
  font.load()

  const encodedLang = utf8Encoder.encode(lang)
  const encodedLangPointer = raqm.malloc(encodedLang.byteLength)
  heapu8.set(encodedLang, encodedLangPointer)

  // TODO: Multifont and scaling
  //raqm.hb_font_set_scale(font, 20 * 72, 20 * 72) // remove this line if you want to have unscaled
  // const font2 = raqm.hb_font_create(face)
  // raqm.hb_font_set_scale(font, 40 * 64, 40 * 64)
  // const font3 = raqm.hb_font_create(face)
  // raqm.hb_font_set_scale(font, 20 * 64, 20 * 64)

  const fonts = [font.fontPointer /*, font2, font3*/]
  const rq = raqm.raqm_create()

  const encodedText = utf8Encoder.encode(text)
  const encodedTextPointer = raqm.malloc(encodedText.byteLength)
  heapu8.set(encodedText, encodedTextPointer)
  raqm.raqm_set_text_utf8(rq, encodedTextPointer, encodedText.byteLength)
  raqm.free(encodedTextPointer)

  raqm.raqm_set_harfbuzz_font_range(
    rq,
    font.fontPointer,
    0,
    encodedText.byteLength
  )
  //raqm.raqm_set_harfbuzz_font_range(rq, font2, 1, 5)
  //raqm.raqm_set_harfbuzz_font_range(rq, font3, 6, 1)
  raqm.hb_font_destroy(font.fontPointer) // rq will hold a reference to font
  //raqm.hb_font_destroy(font2) // rq will hold a reference to font2
  //raqm.hb_font_destroy(font3) // rq will hold a reference to font3
  raqm.raqm_set_par_direction(rq, direction)
  raqm.raqm_set_language(rq, encodedLangPointer, 0, encodedText.byteLength)
  raqm.free(encodedLangPointer)
  raqm.raqm_layout(rq)

  const countPointer = raqm.malloc(4)
  const glyphs = raqm.raqm_get_glyphs(rq, countPointer) / 4
  const count = heapu32[countPointer / 4]
  raqm.free(countPointer)

  const result: Shaping[] = []
  for (let i = 0; i < count; i++) {
    const ptrOffset = glyphs + i * 7
    const shaping = shapingStruct(raqm.memory.buffer, ptrOffset * 4)
    const symbol = text[shaping.cluster]
    //const cluster = heapu32[ptrOffset + 5]
    // const value = {
    //   symbol: text[cluster],
    //   glyphId: heapu32[ptrOffset + 0],
    //   xAdvance: heapu32[ptrOffset + 1],
    //   yAdvance: heapu32[ptrOffset + 2],
    //   xOffset: heapi32[ptrOffset + 3],
    //   yOffset: heapi32[ptrOffset + 4],
    //   cluster,
    //   fontIndex: fonts.indexOf(heapu32[ptrOffset + 6])
    // }

    getGlyphPath(font, shaping.glyphId, symbol)

    result.push({
      ...shaping,
      symbol,
      fontIndex: fonts.indexOf(shaping.font)
    })
  }

  font.free()

  // Cleanup
  raqm.raqm_destroy(rq)

  return result
}
