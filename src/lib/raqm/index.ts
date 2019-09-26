import raqm from './raqm.wasm'

export enum HB_MEMORY_MODE {
  HB_MEMORY_MODE_DUPLICATE,
  HB_MEMORY_MODE_READONLY,
  HB_MEMORY_MODE_WRITABLE,
  HB_MEMORY_MODE_READONLY_MAY_MAKE_WRITABLE
}

export enum RAQM_DIRECTION {
  RAQM_DIRECTION_DEFAULT,
  RAQM_DIRECTION_RTL,
  RAQM_DIRECTION_LTR,
  RAQM_DIRECTION_TTB
}

raqm.memory.grow(400) // each page is 64kb in size

const heapu8 = new Uint8Array(raqm.memory.buffer)
const heapu32 = new Uint32Array(raqm.memory.buffer)

let utf8Encoder = new TextEncoder()

const getTextShaping = (text: string, fontBlob: ArrayBuffer) => {
  var fontBuffer = raqm.malloc(fontBlob.byteLength)
  heapu8.set(new Uint8Array(fontBlob), fontBuffer)

  var blob = raqm.hb_blob_create(
    fontBuffer,
    fontBlob.byteLength,
    2, //HB_MEMORY_MODE.HB_MEMORY_MODE_WRITABLE,
    0,
    0
  )
  var face = raqm.hb_face_create(blob, 0) // second parameter is ttc index
  raqm.hb_blob_destroy(blob)
  var font = raqm.hb_font_create(face)
  raqm.hb_face_destroy(face)
  raqm.hb_font_set_scale(font, 20 * 64, 20 * 64) // remove this line if you want to have unscaled

  var font2 = raqm.hb_font_create(face)
  raqm.hb_font_set_scale(font, 40 * 64, 40 * 64)

  var font3 = raqm.hb_font_create(face)
  raqm.hb_font_set_scale(font, 20 * 64, 20 * 64)

  var fonts = [font, font2, font3]

  var rq = raqm.raqm_create()
  var encodedText = utf8Encoder.encode(text)
  var encodedText_ptr = raqm.malloc(encodedText.byteLength)

  heapu8.set(encodedText, encodedText_ptr)
  raqm.raqm_set_text_utf8(rq, encodedText_ptr, encodedText.byteLength)
  raqm.free(encodedText_ptr)

  raqm.raqm_set_harfbuzz_font_range(rq, font, 0, 1)
  raqm.raqm_set_harfbuzz_font_range(rq, font2, 1, 5)
  raqm.raqm_set_harfbuzz_font_range(rq, font3, 6, 1)
  raqm.hb_font_destroy(font) // rq will hold a reference to font
  raqm.hb_font_destroy(font2) // rq will hold a reference to font2
  raqm.hb_font_destroy(font3) // rq will hold a reference to font3
  raqm.raqm_set_par_direction(rq, 2) // DEFAULT=0 RTL=1 LTR=2 TTB=3
  // raqm.raqm_set_language(rq, language, 0, text.byteLength);
  raqm.raqm_layout(rq)

  var count_ptr = raqm.malloc(4)
  var glyphs = raqm.raqm_get_glyphs(rq, count_ptr) / 4
  var count = heapu32[count_ptr / 4]
  raqm.free(count_ptr)
  var result = []
  for (var i = 0; i < count; ++i)
    result.push({
      g: heapu32[glyphs + i * 7 + 0],
      x_advance: heapu32[glyphs + i * 7 + 1],
      y_advance: heapu32[glyphs + i * 7 + 2],
      x_offset: heapu32[glyphs + i * 7 + 3],
      y_offset: heapu32[glyphs + i * 7 + 4],
      cl: heapu32[glyphs + i * 7 + 5],
      font_index: fonts.indexOf(heapu32[glyphs + i * 7 + 6])
    })

  raqm.raqm_destroy(rq)
  raqm.free(fontBuffer)

  return result
}

export { getTextShaping }
