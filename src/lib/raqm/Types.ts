const WORD = 4
const LITTLE_ENDIAN = true

enum Types {
  u8 = 1,
  i8 = 1 << 1,
  u16 = 1 << 2,
  i16 = 1 << 3,
  u32 = 1 << 4,
  i32 = 1 << 5,
  f32 = 1 << 6,
  f64 = 1 << 7
}

const sizeOf = {
  [Types.u8]: WORD >> 2,
  [Types.i8]: WORD >> 2,
  [Types.u16]: WORD >> 1,
  [Types.i16]: WORD >> 1,
  [Types.u32]: WORD,
  [Types.i32]: WORD,
  [Types.f32]: WORD,
  [Types.f64]: WORD * 2
}

const getTypeFromView = (view: DataView, type: Types, offset: number) => {
  switch (type) {
    case Types.u8:
      return view.getUint8(offset)
    case Types.i8:
      return view.getInt8(offset)
    case Types.u16:
      return view.getUint16(offset, LITTLE_ENDIAN)
    case Types.i16:
      return view.getInt16(offset, LITTLE_ENDIAN)
    case Types.u32:
      return view.getUint32(offset, LITTLE_ENDIAN)
    case Types.i32:
      return view.getInt32(offset, LITTLE_ENDIAN)
    case Types.f32:
      return view.getFloat32(offset, LITTLE_ENDIAN)
    case Types.f64:
      return view.getFloat64(offset, LITTLE_ENDIAN)
    default:
      return 0
  }
}

interface StructDef {
  [key: string]: Types
}

const defineStruct = <
  D extends StructDef,
  T extends { [key in keyof D]: number }
>(
  def: D
) => {
  const size = Object.keys(def).reduce((acc, key) => {
    return acc + sizeOf[def[key]] || 0
  }, 0)

  const struct = (buffer: ArrayBuffer, pointer: number) => {
    const view = new DataView(buffer, pointer, size)
    const result = {} as any
    let offset = 0

    Object.keys(def).map(key => {
      result[key] = getTypeFromView(view, def[key], offset)
      offset += sizeOf[def[key]]
    })

    return result as T
  }

  struct.size = size

  return struct
}

export default Types

export { defineStruct }
