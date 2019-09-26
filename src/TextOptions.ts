import { Color, Vector2, Font } from 'three'
import { Gradient } from './TextSegment'

export interface TextOptions {
  layer: number
  fontFace: string
  size: number
  align: 'left' | 'center' | 'right'
  vAlign: 'top' | 'center' | 'bottom'
  width?: number
  lineHeight?: number
  letterSpacing: number
  color: Color | Gradient | string | number
  strokeWidth: number
  strokeBias: number
  strokeColor: Color | string | number
  alphaTest: number
  scaleDownToPhysicalSize: boolean
  shadow: boolean
  screenSpace: boolean
  constantSizeOnScreen?: boolean
  offset?: Vector2
  bakedOffset?: Vector2
  prescale?: number
  contrastMultiplier: number
}
