import { Color } from 'three'

export interface TextSegment {
  text: string
  color: Color | Gradient | string | number
  fontWeight?: number
  italicSkew?: number
  xOffset?: number
  yOffset?: number
}

interface GradientOptions {
  topLeft?: Color | string | number
  topRight?: Color | string | number
  bottomLeft?: Color | string | number
  bottomRight?: Color | string | number
  top?: Color | string | number
  bottom?: Color | string | number
  left?: Color | string | number
  right?: Color | string | number
}

export class Gradient {
  topLeft: Color
  topRight: Color
  bottomLeft: Color
  bottomRight: Color

  constructor(options: GradientOptions) {
    Object.keys(options).forEach(key => {
      const k = key as keyof GradientOptions
      const option = options[k]
      if (option) {
        const color = toColor(option)
        this[k] = color
      }
    })

    this.topLeft = options.topLeft
      ? toColor(options.topLeft)
      : new Color(0, 0, 0)
    this.topRight = options.topRight
      ? toColor(options.topRight)
      : new Color(0, 0, 0)
    this.bottomLeft = options.bottomLeft
      ? toColor(options.bottomLeft)
      : new Color(0, 0, 0)
    this.bottomRight = options.bottomRight
      ? toColor(options.bottomRight)
      : new Color(0, 0, 0)
  }

  set top(value: Color | number | string) {
    this.topLeft = toColor(value)
    this.topRight = toColor(value)
  }

  set bottom(value: Color | number | string) {
    this.bottomLeft = toColor(value)
    this.bottomRight = toColor(value)
  }

  set left(value: Color | number | string) {
    this.topLeft = toColor(value)
    this.bottomLeft = toColor(value)
  }

  set right(value: Color | number | string) {
    this.topRight = toColor(value)
    this.bottomRight = toColor(value)
  }
}

export const reduceTextSegments = (text: string | TextSegment[]) =>
  Array.isArray(text)
    ? text.reduce((acc, segment) => {
        return acc.concat(segment.text)
      }, '')
    : String(text)

export const toColor = (value: Color | string | number) =>
  value instanceof Color ? value : new Color(value)

export const toGradient = (value: Color | Gradient | string | number) =>
  value instanceof Gradient
    ? value
    : new Gradient({ top: value, bottom: value })

export const toVertexColors = (value: Gradient | Color | number | string) => {
  value = toGradient(value || 0xffffff)

  return {
    topLeft: value.topLeft.toArray(),
    topRight: value.topRight.toArray(),
    bottomLeft: value.bottomLeft.toArray(),
    bottomRight: value.bottomRight.toArray()
  }
}
