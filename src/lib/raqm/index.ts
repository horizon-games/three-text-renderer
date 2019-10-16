import raqm from './raqm.wasm'

export interface Shaping {
  symbol: string
  glyphId: number
  xAdvance: number
  yAdvance: number
  xOffset: number
  yOffset: number
  cluster: number
  fontIndex: number
  path?: Path
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

raqm.memory.grow(400) // each page is 64kb in size

const heapu8 = new Uint8Array(raqm.memory.buffer)
const heapu32 = new Uint32Array(raqm.memory.buffer)
const heapi32 = new Int32Array(raqm.memory.buffer)

const utf8Encoder = new TextEncoder()

const getTextShaping = (
  text: string,
  fontBlob: ArrayBuffer,
  lang: string,
  direction: number
): Shaping[] => {
  const fontBuffer = raqm.malloc(fontBlob.byteLength)
  heapu8.set(new Uint8Array(fontBlob), fontBuffer)

  const blob = raqm.hb_blob_create(
    fontBuffer,
    fontBlob.byteLength,
    HB_MEMORY_MODE.HB_MEMORY_MODE_WRITABLE,
    0,
    0
  )

  const encodedLang = utf8Encoder.encode(lang)
  const encodedLang_ptr = raqm.malloc(encodedLang.byteLength)
  heapu8.set(encodedLang, encodedLang_ptr)

  const face = raqm.hb_face_create(blob, 0) // second parameter is ttc index
  raqm.hb_blob_destroy(blob)

  const font = raqm.hb_font_create(face)
  raqm.hb_face_destroy(face)
  //raqm.hb_font_set_scale(font, 20 * 72, 20 * 72) // remove this line if you want to have unscaled

  // const font2 = raqm.hb_font_create(face)
  // raqm.hb_font_set_scale(font, 40 * 64, 40 * 64)

  // const font3 = raqm.hb_font_create(face)
  // raqm.hb_font_set_scale(font, 20 * 64, 20 * 64)

  const fonts = [font /*, font2, font3*/]
  const rq = raqm.raqm_create()
  const encodedText = utf8Encoder.encode(text)
  const encodedText_ptr = raqm.malloc(encodedText.byteLength)
  heapu8.set(encodedText, encodedText_ptr)
  raqm.raqm_set_text_utf8(rq, encodedText_ptr, encodedText.byteLength)
  raqm.free(encodedText_ptr)

  raqm.raqm_set_harfbuzz_font_range(rq, font, 0, encodedText.byteLength)
  //raqm.raqm_set_harfbuzz_font_range(rq, font2, 1, 5)
  //raqm.raqm_set_harfbuzz_font_range(rq, font3, 6, 1)
  raqm.hb_font_destroy(font) // rq will hold a reference to font
  //raqm.hb_font_destroy(font2) // rq will hold a reference to font2
  //raqm.hb_font_destroy(font3) // rq will hold a reference to font3
  raqm.raqm_set_par_direction(rq, direction)
  raqm.raqm_set_language(rq, encodedLang_ptr, 0, encodedText.byteLength)
  raqm.free(encodedLang_ptr)
  raqm.raqm_layout(rq)

  const count_ptr = raqm.malloc(4)
  const glyphs = raqm.raqm_get_glyphs(rq, count_ptr) / 4
  const count = heapu32[count_ptr / 4]
  raqm.free(count_ptr)

  const result: Shaping[] = []
  for (let i = 0; i < count; ++i) {
    const ptrOffset = glyphs + i * 7
    const cluster = heapu32[ptrOffset + 5]
    const glyphId = heapu32[ptrOffset + 0]

    const shaping: Shaping = {
      symbol: text[cluster],
      glyphId,
      xAdvance: heapu32[ptrOffset + 1],
      yAdvance: heapu32[ptrOffset + 2],
      xOffset: heapi32[ptrOffset + 3],
      yOffset: heapi32[ptrOffset + 4],
      cluster,
      fontIndex: fonts.indexOf(heapu32[ptrOffset + 6])
    }

    // Contours
    const glyph_path_len_ptr = raqm.malloc(4)
    heapu32[glyph_path_len_ptr / 4] = 200
    const glyph_path_ptr = raqm.malloc(12 * 200)
    const pathLength = raqm.hb_ot_glyph_get_outline_path(
      font,
      glyphId,
      0,
      glyph_path_len_ptr,
      glyph_path_ptr
    )

    //const pathLength = heapu32[glyph_path_len_ptr / 4]
    const path = new Path()

    for (let i = 0; i < pathLength; i++) {
      const type = String.fromCharCode(heapu8[glyph_path_ptr + i * 12])

      switch (type) {
        case 'M': // Move
          path.moveTo(
            heapi32[glyph_path_ptr / 4 + i * 3 + 1],
            heapi32[glyph_path_ptr / 4 + i * 3 + 2]
          )
          break
        case 'L': // Line
          path.lineTo(
            heapi32[glyph_path_ptr / 4 + i * 3 + 1],
            heapi32[glyph_path_ptr / 4 + i * 3 + 2]
          )
          break

        case 'Q': // Quadatic - 1 control point curve
          path.quadraticTo(
            heapi32[glyph_path_ptr / 4 + i * 3 + 1],
            heapi32[glyph_path_ptr / 4 + i * 3 + 2],
            heapi32[glyph_path_ptr / 4 + (i + 1) * 3 + 1],
            heapi32[glyph_path_ptr / 4 + (i + 1) * 3 + 2]
          )
          break

        case 'C': // Cubic curve - 2 control point curve
          break

        case 'Z': // End
          path.close()
          break
      }
    }

    shaping.path = path

    result.push(shaping)

    raqm.free(glyph_path_len_ptr)
    raqm.free(glyph_path_ptr)
  }

  // Cleanup
  raqm.raqm_destroy(rq)
  raqm.free(fontBuffer)

  return result
}

interface MoveCommand {
  type: 'M'
  x: number
  y: number
}

interface LineCommand {
  type: 'L'
  x: number
  y: number
}

interface CloseCommand {
  type: 'Z'
}

interface QuadraticCurveCommand {
  type: 'Q'
  cpx: number
  cpy: number
  x: number
  y: number
}

interface BezierCurveCommand {
  type: 'C'
  cp1x: number
  cp1y: number
  cp2x: number
  cp2y: number
  x: number
  y: number
}

type Command =
  | MoveCommand
  | LineCommand
  | QuadraticCurveCommand
  | BezierCurveCommand
  | CloseCommand

export class Path {
  commands: Command[] = []

  moveTo(x: number, y: number) {
    this.commands.push({ type: 'M', x, y })
  }

  lineTo(x: number, y: number) {
    this.commands.push({ type: 'L', x, y })
  }

  quadraticTo(cpx: number, cpy: number, x: number, y: number) {
    this.commands.push({ type: 'Q', cpx, cpy, x, y })
  }

  bezierTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ) {
    this.commands.push({ type: 'C', cp1x, cp1y, cp2x, cp2y, x, y })
  }

  close() {
    this.commands.push({ type: 'Z' })
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()

    this.commands.forEach(cmd => {
      switch (cmd.type) {
        case 'M':
          ctx.moveTo(cmd.x, cmd.y)
          break

        case 'L':
          ctx.lineTo(cmd.x, cmd.y)
          break

        case 'Q':
          ctx.quadraticCurveTo(cmd.cpx, cmd.cpy, cmd.x, cmd.y)
          break

        case 'C':
          ctx.bezierCurveTo(
            cmd.cp1x,
            cmd.cp1y,
            cmd.cp2x,
            cmd.cp2y,
            cmd.x,
            cmd.y
          )
          break

        case 'Z':
          ctx.closePath()
          break
      }
    })

    ctx.fill()
  }

  getBoundingBox() {
    const box = new BoundingBox()

    let startX = 0
    let startY = 0
    let prevX = 0
    let prevY = 0

    for (const cmd of this.commands) {
      switch (cmd.type) {
        case 'M':
          box.addPoint(cmd.x, cmd.y)
          startX = prevX = cmd.x
          startY = prevY = cmd.y
          break
        case 'L':
          box.addPoint(cmd.x, cmd.y)
          prevX = cmd.x
          prevY = cmd.y
          break
        case 'Q':
          box.addQuad(prevX, prevY, cmd.cpx, cmd.cpy, cmd.x, cmd.y)
          prevX = cmd.x
          prevY = cmd.y
          break
        case 'C':
          box.addBezier(
            prevX,
            prevY,
            cmd.cp1x,
            cmd.cp1y,
            cmd.cp2x,
            cmd.cp2y,
            cmd.x,
            cmd.y
          )
          prevX = cmd.x
          prevY = cmd.y
          break
        case 'Z':
          prevX = startX
          prevY = startY
          break
      }
    }

    return box
  }
}

const derive = (v0: number, v1: number, v2: number, v3: number, t: number) => {
  return (
    Math.pow(1 - t, 3) * v0 +
    3 * Math.pow(1 - t, 2) * t * v1 +
    3 * (1 - t) * Math.pow(t, 2) * v2 +
    Math.pow(t, 3) * v3
  )
}

export class BoundingBox {
  x1 = Infinity
  y1 = Infinity
  x2 = -Infinity
  y2 = -Infinity

  addX(x: number) {
    if (x < this.x1) {
      this.x1 = x
    }
    if (x > this.x2) {
      this.x2 = x
    }
  }

  addY(y: number) {
    if (y < this.y1) {
      this.y1 = y
    }
    if (y > this.y2) {
      this.y2 = y
    }
  }

  addPoint(x: number, y: number) {
    this.addX(x)
    this.addY(y)
  }

  addBezier(
    x0: number,
    y0: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ) {
    // This code is based on http://nishiohirokazu.blogspot.com/2009/06/how-to-calculate-bezier-curves-bounding.html
    // and https://github.com/icons8/svg-path-bounding-box

    const p0 = [x0, y0]
    const p1 = [cp1x, cp1y]
    const p2 = [cp2x, cp2y]
    const p3 = [x, y]

    this.addPoint(x0, y0)
    this.addPoint(x, y)

    for (let i = 0; i <= 1; i++) {
      const b = 6 * p0[i] - 12 * p1[i] + 6 * p2[i]
      const a = -3 * p0[i] + 9 * p1[i] - 9 * p2[i] + 3 * p3[i]
      const c = 3 * p1[i] - 3 * p0[i]

      if (a === 0) {
        if (b === 0) {
          continue
        }
        const t = -c / b
        if (0 < t && t < 1) {
          if (i === 0) {
            this.addX(derive(p0[i], p1[i], p2[i], p3[i], t))
          }
          if (i === 1) {
            this.addY(derive(p0[i], p1[i], p2[i], p3[i], t))
          }
        }
        continue
      }

      const b2ac = Math.pow(b, 2) - 4 * c * a
      if (b2ac < 0) {
        continue
      }
      const t1 = (-b + Math.sqrt(b2ac)) / (2 * a)
      if (0 < t1 && t1 < 1) {
        if (i === 0) {
          this.addX(derive(p0[i], p1[i], p2[i], p3[i], t1))
        }
        if (i === 1) {
          this.addY(derive(p0[i], p1[i], p2[i], p3[i], t1))
        }
      }
      const t2 = (-b - Math.sqrt(b2ac)) / (2 * a)
      if (0 < t2 && t2 < 1) {
        if (i === 0) {
          this.addX(derive(p0[i], p1[i], p2[i], p3[i], t2))
        }
        if (i === 1) {
          this.addY(derive(p0[i], p1[i], p2[i], p3[i], t2))
        }
      }
    }
  }

  addQuad(
    x0: number,
    y0: number,
    cpx: number,
    cpy: number,
    x: number,
    y: number
  ) {
    const cp1x = x0 + (2 / 3) * (cpx - x0)
    const cp1y = y0 + (2 / 3) * (cpy - y0)
    const cp2x = cp1x + (1 / 3) * (x - x0)
    const cp2y = cp1y + (1 / 3) * (y - y0)

    this.addBezier(x0, y0, cp1x, cp1y, cp2x, cp2y, x, y)
  }
}

export { getTextShaping }
