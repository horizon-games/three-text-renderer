import {
  BufferGeometry,
  Float32BufferAttribute,
  Sphere,
  Uint16BufferAttribute,
  Vector3
} from 'three'

export default class SDFCurveGeometry extends BufferGeometry {
  constructor(segments: number) {
    super()
    const chunks = segments + 1
    const tracks = 3
    const ratioSignArr = new Float32Array(chunks * tracks * 2)
    for (let i = 0; i < chunks; i++) {
      const ratio = i / segments
      const i6 = i * 6
      ratioSignArr[i6] = ratio
      ratioSignArr[i6 + 1] = -1
      ratioSignArr[i6 + 2] = ratio
      ratioSignArr[i6 + 3] = 0
      ratioSignArr[i6 + 4] = ratio
      ratioSignArr[i6 + 5] = 1
    }
    this.addAttribute('ratioSign', new Float32BufferAttribute(ratioSignArr, 2))
    const indexArr = new Uint16Array(segments * 12)
    for (let i = 0; i < segments; i++) {
      const i3 = i * 3
      const i12 = i * 12

      // indexArr[i12] = i3+0
      // indexArr[i12+1] = i3+2
      // indexArr[i12+2] = i3+1
      // indexArr[i12+3] = i3+1
      // indexArr[i12+4] = i3+2
      // indexArr[i12+5] = i3+3

      indexArr[i12] = i3 + 0
      indexArr[i12 + 1] = i3 + 3
      indexArr[i12 + 2] = i3 + 1
      indexArr[i12 + 3] = i3 + 1
      indexArr[i12 + 4] = i3 + 3
      indexArr[i12 + 5] = i3 + 4

      indexArr[i12 + 6] = i3 + 1
      indexArr[i12 + 7] = i3 + 4
      indexArr[i12 + 8] = i3 + 2
      indexArr[i12 + 9] = i3 + 2
      indexArr[i12 + 10] = i3 + 4
      indexArr[i12 + 11] = i3 + 5
    }
    this.setIndex(new Uint16BufferAttribute(indexArr, 1))
  }
  computeBoundingSphere() {
    this.boundingSphere = new Sphere(new Vector3(), 1)
  }
}
