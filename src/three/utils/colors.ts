import { Color, Matrix4, MeshBasicMaterial, Vector3 } from 'three'

import { clamp, rand } from '../../utils/math'

const __whiteColor = new Color(1, 1, 1)
const __tempColor = new Color()

export function addColor(dst: Color, src: Color, amt: number) {
  if (amt === 0) {
    return
  }
  __tempColor.copy(src).multiplyScalar(amt)
  dst.add(__tempColor)
}

export function screenColor(dst: Color, src: Color) {
  __tempColor.copy(__whiteColor).sub(dst)
  dst.add(__tempColor.multiply(src))
}

export function createMaterial(col: Color | string | number) {
  const color = new Color(col)
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  hsl.h += rand(-0.025, 0.025)
  hsl.s += rand(-0.05, 0.05)
  hsl.l += rand(-0.05, 0.05)
  color.setHSL(hsl.h, hsl.s, hsl.l)
  const mat = new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.2,
    depthWrite: false
  })
  mat.color = color
  return mat
}

export function makeHSL(h: number, s: number = 0.75, l: number = 0.5) {
  return new Color().setHSL(h, s, l)
}

//color style algorithm extracted from three.js
export function hexColor(style: string) {
  const m = /^\#([A-Fa-f0-9]+)$/.exec(style)
  if (m) {
    // hex color

    const hex = m[1]
    const size = hex.length

    if (size === 3) {
      const color = new Color()
      // #ff0
      color.r = parseInt(hex.charAt(0) + hex.charAt(0), 16) / 255
      color.g = parseInt(hex.charAt(1) + hex.charAt(1), 16) / 255
      color.b = parseInt(hex.charAt(2) + hex.charAt(2), 16) / 255

      return color
    } else if (size === 6) {
      const color = new Color()
      // #ff0000
      color.r = parseInt(hex.charAt(0) + hex.charAt(1), 16) / 255
      color.g = parseInt(hex.charAt(2) + hex.charAt(3), 16) / 255
      color.b = parseInt(hex.charAt(4) + hex.charAt(5), 16) / 255

      return color
    }
  }
  return new Color(1, 0, 1)
}

function fTob(f: number) {
  return ~~(f * 255)
}

function fToFS(f: number) {
  return f.toFixed(2)
}

export function niceColorToByteString(c: Color) {
  return `r:${fTob(c.r)} g:${fTob(c.g)} b:${fTob(c.b)}`
}

export function niceColorToFloatString(c: Color) {
  return `r:${fToFS(c.r)} g:${fToFS(c.g)} b:${fToFS(c.b)}`
}

export function nicePLabToString(p: Vector3) {
  return `L:${fToFS(p.x)} a:${fToFS(p.y)} b:${fToFS(p.z)}`
}

function m() {
  return new Matrix4()
}
const cubeNormalizer = 1 / Math.sqrt(3)
const rgbToPlabMatrix = m()
  .premultiply(m().makeRotationX(Math.PI * -0.25))
  .premultiply(m().makeRotationZ(Math.PI * -0.3041))
  .premultiply(m().makeScale(cubeNormalizer, -cubeNormalizer, -cubeNormalizer))
const pLabToRgbMatrix = m().getInverse(rgbToPlabMatrix)

//PLab, or Psuedo-Lab is a mathematically simple version of Lab colorspace without Relative Luminance compensation

export function colorToPLab(c: Color) {
  const pLab = new Vector3(c.r, c.g, c.b)
  pLab.applyMatrix4(rgbToPlabMatrix)
  return pLab
}

export function PLabToColor(pLab: Vector3) {
  const rgb = pLab.clone().applyMatrix4(pLabToRgbMatrix)
  return new Color(rgb.x, rgb.y, rgb.z)
}

export type XYZ = 'x' | 'y' | 'z'
export type LabHS = 'L' | 'a' | 'b' | 'H' | 'S'

export const PLabLabels: { [K in XYZ]: LabHS } = {
  ['x']: 'L',
  ['y']: 'a',
  ['z']: 'b'
}

export const PLabAxis: { [K in LabHS]: XYZ | undefined } = {
  ['L']: 'x',
  ['a']: 'y',
  ['b']: 'z',
  ['H']: undefined,
  ['S']: undefined
}

// function testColorConversion(r:number, g:number, b:number) {
//   const rgb = new Color(r, g, b)
//   const pLab = colorToPLab(rgb)
//   const rgb2 = new Color(r, g, b)
//   console.log('color:'+niceColorToByteString(rgb))
//   console.log('pLab:'+nicePLabToString(pLab))
//   console.log('color2:'+niceColorToByteString(rgb2))
// }

// testColorConversion(0, 0, 0)
// testColorConversion(1, 1, 1)
// testColorConversion(1, 0, 0)
// testColorConversion(0, 1, 0)
// testColorConversion(0, 0, 1)
// testColorConversion(100, 100, 100)
// testColorConversion(10, 6, 4)

export function clampColor(c: Color) {
  c.r = clamp(c.r, 0, 1)
  c.g = clamp(c.g, 0, 1)
  c.b = clamp(c.b, 0, 1)
  return c
}
