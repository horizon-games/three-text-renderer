import { WebGLRenderer } from 'three'

import {
  downsamplePixels
} from './renderSettings'
import {
  devicePixelRatioUniform,
  pixelSizeInClipSpaceUniform
} from './uniforms'
import { isWebGLAvailable } from '../utils/webgl'
import device from '../device'

if (!isWebGLAvailable) {
  throw new Error('No WebGL support')
}

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)
const context = canvas.getContext('webgl') as WebGLRenderingContext
const renderer = new WebGLRenderer({
  canvas,
  context,
  antialias: true,
  premultipliedAlpha: false
  // powerPreference: "high-performance"
  // powerPreference: "low-power"
})
const attributeValues: string[] = [
  '-moz-crisp-edges',
  '-webkit-crisp-edges',
  'pixelated',
  'crisp-edges'
]

attributeValues.forEach(v => {
  const canvas = renderer.getContext().canvas as HTMLCanvasElement
  canvas.style.setProperty('image-rendering', v)
})

renderer.info.autoReset = false
renderer.gammaOutput = true
renderer.gammaFactor = 2.2
renderer.autoClear = false

let __downsample = 1
function updatePixelRatio() {
  const pixelRatio = device.pixelRatio / (5 - __downsample)
  renderer.setPixelRatio(pixelRatio)
}

downsamplePixels.listen(downsample => {
  __downsample = Math.round(downsample + 1)
  updatePixelRatio()
})

device.onChange(() => {
  updatePixelRatio()
  const { width, height } = device
  renderer.setSize(width, height)
  devicePixelRatioUniform.value = device.pixelRatio
  pixelSizeInClipSpaceUniform.value.set(2 / width, 2 / height)
}, true)

export const maxTextureSize =
  Math.min(8192, renderer.capabilities.maxTextureSize)

export default renderer
