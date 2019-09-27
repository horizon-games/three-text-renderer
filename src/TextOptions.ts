//import { Color } from 'three'
//import { Gradient } from './TextSegment'

export enum TextDirection {
  Default,
  RTL,
  LTR,
  TTB
}

export type Language = 'en' | 'fr' | 'ar' | 'hi'

export interface TextOptions {
  fontFace: string
  fontSize: number
  lang: Language
  direction: TextDirection
  // color: Color | Gradient | string | number
  // align: 'left' | 'center' | 'right'
  // vAlign: 'top' | 'center' | 'bottom'
  // width?: number
  // lineHeight?: number
  // letterSpacing: number
  // strokeWidth: number
  // strokeBias: number
  // strokeColor: Color | string | number
  // alphaTest: number
  // scaleDownToPhysicalSize: boolean
  // shadow: boolean
  // screenSpace: boolean
  // constantSizeOnScreen?: boolean
  // offset?: Vector2
  // bakedOffset?: Vector2
  // prescale?: number
  // contrastMultiplier: number
  // layer: number
}
