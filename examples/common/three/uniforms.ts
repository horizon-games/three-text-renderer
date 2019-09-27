import { Uniform, Vector2 } from 'three'

import device from '../device'

export const timeUniform = new Uniform(0.0)

export const devicePixelRatioUniform = new Uniform(device.pixelRatio)
export const pixelSizeInClipSpaceUniform = new Uniform(
  new Vector2(2 / device.width, 2 / device.height)
)
