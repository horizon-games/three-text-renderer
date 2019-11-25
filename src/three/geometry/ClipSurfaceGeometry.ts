import { BufferAttribute, BufferGeometry } from 'three'

export default class ClipSurfaceGeometry extends BufferGeometry {
  constructor() {
    super()
    this.setAttribute(
      'position',
      new BufferAttribute(
        new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
        2,
        false
      )
    )
    this.setAttribute(
      'uv',
      new BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 1, 1, 0]), 2, false)
    )
    this.setIndex(
      new BufferAttribute(new Uint16Array([0, 2, 1, 0, 3, 2]), 1, false)
    )
  }
}
