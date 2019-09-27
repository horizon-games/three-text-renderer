import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  PlaneBufferGeometry,
  RawShaderMaterial,
  Texture,
  Uniform,
  Vector2
} from 'three'

import TextRenderer from '..'
import { TextOptions } from '../TextOptions'
import {
  Gradient,
  reduceTextSegments,
  TextSegment,
  toColor,
  toGradient,
  toVertexColors
} from '../TextSegment'

// TODO need to replace create geometry with our own tool
//import createGeometry from 'three-bmfont-text'
import fragmentShader from './frag.glsl'
import vertexShader from './vert.glsl'

const PPI = 72
const INCHES_PER_METER = 1 / 0.0254
const PPM = PPI * INCHES_PER_METER
const DEFAULT_FONT_WEIGHT = 1.0
const DEFAULT_ITALIC_SKEW = 0.0

const createGeometry = (_: any = {}): any => {
  return {}
}

export default class TextMesh extends Mesh {
  options: TextOptions
  onMeasurementsUpdated?: (mesh: TextMesh) => void

  width: number = 0
  height: number = 0

  livePropObject?: object
  livePropName?: string
  optimizeRenderOrder: boolean

  private _dirty: boolean
  private _text: string | TextSegment[]
  private _globalColor: Color | Gradient | undefined
  private newTexture?: Texture

  constructor(
    text: string | TextSegment[] = '',
    textRenderer: TextRenderer,
    options: TextOptions,
    livePropObject?: any,
    livePropName?: string,
    onMeasurementsUpdated?: (mesh: TextMesh) => void,
    optimizeRenderOrder: boolean = true
  ) {
    super(
      tryCreateTextGeometry(text, textRenderer, options),
      initMaterial(textRenderer, options)
    )

    this.onMeasurementsUpdated = onMeasurementsUpdated
    this.optimizeRenderOrder = optimizeRenderOrder

    this._text = text
    this.updateMeasurements()

    this.userData.isFrontFacing = true
    this.userData.doNotBillboard = true

    this.layers.set(options.layer)
    this.options = options
    this.livePropObject = livePropObject
    this.livePropName = livePropName
    this.frustumCulled = false
    this._dirty = true
  }

  get dirty() {
    return this._dirty
  }
  set dirty(value: boolean) {
    if (!this._dirty && value) {
      this._dirty = value
      requestAnimationFrame(this.updateGeometry)
    }
  }

  set text(text: string | TextSegment[]) {
    if (typeof text === 'number') {
      text = String(text)
    }

    if (this._text !== text) {
      //const textStr = reduceTextSegments(text)
      this._text = text
      this.dirty = true
    }
  }

  set color(value: Color | Gradient | string | number) {
    if (typeof value !== 'object') {
      value = toColor(value)
    }

    this._globalColor = value

    const { topLeft, topRight, bottomLeft, bottomRight } = toVertexColors(value)
    const colorBufferAttribute = (this.geometry as BufferGeometry).getAttribute(
      'color'
    ) as BufferAttribute

    if (colorBufferAttribute) {
      const colors = colorBufferAttribute.array as Float32Array

      for (let i = 0; i < colors.length; i += 12) {
        colors.set(topLeft, i + 0)
        colors.set(bottomLeft, i + 3)
        colors.set(bottomRight, i + 6)
        colors.set(topRight, i + 9)
      }

      colorBufferAttribute.needsUpdate = true
    }
  }

  set strokeWidth(value: number) {
    const mat = this.material as RawShaderMaterial
    if (mat.uniforms.strokeWidth.value !== value) {
      mat.uniforms.strokeWidth.value = value
      const needsStrokeShader = value > 0
      if (needsStrokeShader !== mat.defines.USE_STROKE) {
        mat.defines.USE_STROKE = needsStrokeShader
        mat.needsUpdate = true
      }
    }
  }

  get opacity() {
    return (this.material as RawShaderMaterial).uniforms.opacity.value
  }

  set opacity(value: number) {
    ;(this.material as RawShaderMaterial).uniforms.opacity.value = value
  }

  onFontTextureUpdate = (texture: Texture) => {
    this.newTexture = texture
    this.dirty = true
  }

  updateGeometry = () => {
    if (this._dirty) {
      this._dirty = false
      this.regenerateGeometry()
      if (this.newTexture) {
        ;(this
          .material as RawShaderMaterial).uniforms.msdf.value = this.newTexture
        this.newTexture = undefined
      }
    }
  }

  updateText = (value: any = '') => {
    this.text = `${value}`
  }

  setSize(_width: number, _height: number) {
    //
  }

  private regenerateGeometry() {
    const oldGeometry = this.geometry
    if (oldGeometry && oldGeometry !== tempBlankGeo) {
      requestAnimationFrame(() => oldGeometry.dispose())
    }
    this.geometry = tryCreateTextGeometry(
      this._text,
      this.options,
      this._globalColor
    )

    this.updateMeasurements()
  }

  private updateMeasurements() {
    const bb = this.geometry.boundingBox
    this.width = bb.max.x - bb.min.x
    this.height = Math.abs(bb.max.y - bb.min.y)
    this.userData.resolution = new Vector2(this.width, this.height)
    if (this.onMeasurementsUpdated) {
      this.onMeasurementsUpdated(this)
    }
  }
}

interface MSDFShaderUniforms {
  msdf: { value: Texture }
  alphaTest: { value: number }
  strokeWidth: { value: number }
  strokeBias: { value: number }
  strokeColor: { value: Color }
  opacity: { value: number }
  offset?: Uniform
  prescale?: Uniform
  contrastMultiplier: { value: number }
}

const initMaterial = (textRenderer: TextRenderer, options: TextOptions) => {
  const uniforms: MSDFShaderUniforms = {
    msdf: new Uniform(textRenderer.texture),
    alphaTest: new Uniform(options.alphaTest),
    strokeWidth: new Uniform(options.strokeWidth),
    strokeBias: new Uniform(options.strokeBias),
    strokeColor: new Uniform(new Color(options.strokeColor)),
    opacity: new Uniform(1.0),
    contrastMultiplier: new Uniform(options.contrastMultiplier)
  }

  const hardText =
    options.alphaTest > 0 && options.alphaTest < 1 && !options.shadow
  const material = new RawShaderMaterial({
    defines: {
      USE_STROKE: options.strokeWidth > 0,
      USE_ALPHATEST: hardText,
      USE_SHADOW: options.shadow,
      CONSTANT_SIZE_ON_SCREEN: options.constantSizeOnScreen
    },
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: hardText
  })

  Object.defineProperty(material, 'opacity', {
    get: () => material.uniforms.opacity.value,
    set: (value: number) => (material.uniforms.opacity.value = value)
  })

  return material
}

const tempBlankGeo = new PlaneBufferGeometry(0.001, 0.001)
tempBlankGeo.computeBoundingBox()

const tryCreateTextGeometry = (
  text: string | TextSegment[],
  textRenderer: TextRenderer,
  options: TextOptions,
  overrideColor?: Color | Gradient
): BufferGeometry => {
  if (options.fontFace.font && text) {
    return createTextGeometry(text, textRenderer, options, overrideColor)
  } else {
    return tempBlankGeo
  }
}

const createTextGeometry = (
  text: string | TextSegment[],
  textRenderer: TextRenderer,
  options: TextOptions,
  overrideColor?: Color | Gradient
): BufferGeometry => {
  const font = options.fontFace.font!
  const textStr = reduceTextSegments(text)
  const geometry = createGeometry({
    text: `${textStr}`,
    font,
    align: options.align,
    width:
      options.width !== undefined
        ? (options.width / options.size) * font.info.size
        : undefined,
    lineHeight:
      options.lineHeight !== undefined
        ? options.lineHeight * font.info.size
        : undefined,
    letterSpacing: options.letterSpacing
  })
  const positions = geometry.getAttribute('position').array as Float32Array
  const vertCount = positions.length / 2
  //const charCount = vertCount / 4
  const defaultColor = toGradient(overrideColor || options.color)
  const segments: TextSegment[] = Array.isArray(text)
    ? text
    : [
        {
          text: textStr,
          color: defaultColor
        }
      ]
  const { base } = font.common
  const colors = new Float32Array(vertCount * 3)
  const weights = new Float32Array(vertCount)

  let charIdx = 0

  segments.forEach(segment => {
    const { topLeft, topRight, bottomLeft, bottomRight } = toVertexColors(
      segment.color
    )
    const fontWeight = segment.fontWeight || DEFAULT_FONT_WEIGHT
    const italicSkew = segment.italicSkew || DEFAULT_ITALIC_SKEW
    const xOffset = segment.xOffset || 0
    const yOffset = segment.yOffset || 0
    const stripped = segment.text.replace(/\s+/g, '')
    const start = charIdx
    const end = charIdx + stripped.length

    for (let i = start; i < end; i++) {
      const colorIdx = i * 12
      const weightIdx = i * 4
      const vertIdx = weightIdx * 2
      const char = stripped[i - charIdx]
      const charMeta = font.chars.find((x: any) => String(x.char) === char)!

      // Color gradient
      colors.set(topLeft, colorIdx + 0)
      colors.set(bottomLeft, colorIdx + 3)
      colors.set(bottomRight, colorIdx + 6)
      colors.set(topRight, colorIdx + 9)

      // Weight - need to adjust position to account for additional font width weighting applies.
      weights[weightIdx + 0] = fontWeight
      weights[weightIdx + 1] = fontWeight
      weights[weightIdx + 2] = fontWeight
      weights[weightIdx + 3] = fontWeight

      // Italics skew - adjust the position geometry attribute directly to save calculations in shader
      const skew = base * italicSkew
      const descender = charMeta.height + charMeta.yoffset - base
      const italicSkewForward = ((base - charMeta.yoffset) / base) * skew
      const italicSkewBack = descender > 0 ? (descender / base) * -skew : 0.0

      // Top verts
      positions[vertIdx + 0] += italicSkewForward
      positions[vertIdx + 6] += italicSkewForward

      //Bottom verts
      positions[vertIdx + 2] += italicSkewBack
      positions[vertIdx + 4] += italicSkewBack

      // Add Offsets
      positions[vertIdx + 0] += xOffset
      positions[vertIdx + 1] += yOffset
      positions[vertIdx + 2] += xOffset
      positions[vertIdx + 3] += yOffset
      positions[vertIdx + 4] += xOffset
      positions[vertIdx + 5] += yOffset
      positions[vertIdx + 6] += xOffset
      positions[vertIdx + 7] += yOffset
    }

    charIdx = end
  })

  geometry.addAttribute('color', new BufferAttribute(colors, 3))
  geometry.addAttribute('weight', new BufferAttribute(weights, 1))

  const x = options.bakedOffset ? options.bakedOffset.x : 0
  const y = options.bakedOffset ? options.bakedOffset.y : 0

  geometry.computeBoundingBox()
  const bb = geometry.boundingBox
  if (options.width) {
    const layoutWidth = geometry.layout.width
    bb.max.x = layoutWidth - bb.min.x
  }
  const bbMin = bb.min
  const bbMax = bb.max

  const posAttr = geometry.attributes.position
  const itemSize = posAttr.itemSize

  const posArr: Float32Array = posAttr.array as Float32Array

  if (text === '1') {
    for (let i = 0; i < posArr.length; i += itemSize) {
      posArr[i] -= 2
    }
  }

  //alignment according to glyph layout
  const bbWidth = bbMax.x - bbMin.x
  const lo = geometry.layout
  const charsHeight = (lo._linesTotal - 1) * lo.lineHeight + lo.capHeight
  const xOffset = x + bbWidth * getHorizontalBias(options.align) - bbMin.x
  // const yOffset = lo.capHeight
  const yOffset = y + charsHeight * getVerticalBias(options.vAlign)
  for (let i = 0; i < posArr.length; i += itemSize) {
    posArr[i] += xOffset
    posArr[i + 1] += yOffset
  }
  //always do same transforms to bounding box min and max. much cheaper than recalculating bounding box
  bbMax.x += xOffset
  bbMin.x += xOffset
  bbMax.y += yOffset
  bbMin.y += yOffset

  //flip on Y to fix winding order and orientation from TOP-LEFT paradigm (like canvas or photoshop)
  for (let i = 1; i < posArr.length; i += itemSize) {
    posArr[i] *= -1
  }
  //always do same transforms to bounding box min and max. much cheaper than recalculating bounding box
  bbMin.y *= -1
  bbMax.y *= -1

  let scale = options.size / font.info.size
  if (options.scaleDownToPhysicalSize) {
    scale /= PPM
  }
  //scale down to the correct font point size as it would be printed at 72 ppi
  for (let i = 0; i < posArr.length; i++) {
    posArr[i] *= scale
  }
  //always do same transforms to bounding box min and max. much cheaper than recalculating bounding box
  bbMin.multiplyScalar(scale)
  bbMax.multiplyScalar(scale)

  if (bbMin.y > bbMax.y) {
    const temp = bbMin.y
    bbMin.y = bbMax.y
    bbMax.y = temp
  }

  return geometry
}

const getHorizontalBias = (align: string): number => {
  switch (align) {
    case 'left':
      return 0
    case 'center':
      return -0.5
    case 'right':
      return -1
    default:
      return 0
  }
}

const getVerticalBias = (vAlign: string): number => {
  switch (vAlign) {
    case 'top':
      return 1
    case 'center':
      return 0.5
    case 'bottom':
      return 0
    default:
      return 0
  }
}
