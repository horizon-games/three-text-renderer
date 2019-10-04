import { BoundingBox, Path } from 'opentype.js'

import { TextAlign, TextDirection, TextOptions } from './TextOptions'
import TextRenderer, { Line, ShapedGlyph } from './TextRenderer'

export default TextRenderer

export {
  Path,
  BoundingBox,
  TextOptions,
  TextDirection,
  TextAlign,
  Line,
  ShapedGlyph
}
