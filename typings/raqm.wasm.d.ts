// declare const enum HB_MEMORY_MODE {
//   HB_MEMORY_MODE_DUPLICATE,
//   HB_MEMORY_MODE_READONLY,
//   HB_MEMORY_MODE_WRITABLE,
//   HB_MEMORY_MODE_READONLY_MAY_MAKE_WRITABLE
// }

// declare const enum RAQM_DIRECTION {
//   RAQM_DIRECTION_DEFAULT,
//   RAQM_DIRECTION_RTL,
//   RAQM_DIRECTION_LTR,
//   RAQM_DIRECTION_TTB
// }

declare module '*raqm.wasm' {
  type Ptr = number
  type FacePtr = Ptr
  type FontPtr = Ptr
  type BlobPtr = Ptr
  type I32Ptr = Ptr
  type CharPtr = Ptr
  type RqPtr = Ptr
  type RqGlyphPtr = Ptr

  interface Raqm {
    memory: WebAssembly.Memory
    free: (ptr: number) => void
    malloc: (size: number) => number
    hb_blob_create: (
      data_ptr: Ptr,
      length: number,
      mode: number /* HB_MEMORY_MODE */,
      user_data_ptr: Ptr,
      hb_destroy_func: number
    ) => BlobPtr
    hb_blob_destroy: (blob: BlobPtr) => void
    hb_blob_get_length: (blob: BlobPtr) => number

    hb_face_create: (blob: BlobPtr, index: number) => FacePtr
    hb_face_destroy: (face: FacePtr) => void
    hb_face_get_glyph_count: (face: FacePtr) => number
    hb_face_get_upem: (face: FacePtr) => number

    hb_font_create: (face: FacePtr) => FontPtr
    hb_font_destroy: (font: FontPtr) => void
    hb_font_set_scale: (font: FontPtr, x_scale: number, y_scale: number) => void
    hb_font_get_h_extents: (font: FontPtr, fontExtends: Ptr) => void

    hb_ot_glyph_path_create_from_font: (
      font: FontPtr,
      glyphId: number
    ) => number
    hb_ot_glyph_path_get_coords: (glyphPath: number, tempPtr: number) => number
    hb_ot_glyph_path_get_commands: (
      glyphPath: number,
      tempPtr: number
    ) => number
    hb_ot_glyph_path_destroy: (glyph_path: number) => void

    raqm_create: () => RqPtr
    raqm_destroy: (rq: RqPtr) => void
    raqm_get_glyphs: (rq: RqPtr, len: number) => RqGlyphPtr
    raqm_index_to_position: (
      rq: RqPtr,
      index: number,
      x: number,
      y: number
    ) => boolean
    raqm_layout: (rq: RqPtr) => void
    raqm_position_to_index: (
      rq: RqPtr,
      x: number,
      y: number,
      index: number
    ) => boolean
    raqm_reference: (rq: RqPtr) => void
    raqm_set_harfbuzz_font: (rq: RqPtr, font: FontPtr) => void
    raqm_set_harfbuzz_font_range: (
      rq: RqPtr,
      font: FontPtr,
      start: number,
      len: number
    ) => void
    raqm_set_invisible_glyph: (rq: RqPtr, gid: number) => boolean
    raqm_set_language: (
      rq: RqPtr,
      lang: CharPtr,
      start: number,
      len: number
    ) => boolean
    raqm_set_par_direction: (
      rq: RqPtr,
      dir: number /* RAQM_DIRECTION */
    ) => boolean
    raqm_set_text: (rq: RqPtr, text: I32Ptr, len: number) => void
    raqm_set_text_utf8: (rq: RqPtr, text: CharPtr, len: number) => boolean
    __data_end: WebAssembly.Global
    __heap_base: WebAssembly.Global
  }

  const value: Raqm
  export default value
}
