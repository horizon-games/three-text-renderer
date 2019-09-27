import { PlaneBufferGeometry, Vector3 } from 'three'

let __unitPlaneGeometry: PlaneBufferGeometry | undefined
export function getCachedUnitPlaneGeometry() {
  if (!__unitPlaneGeometry) {
    __unitPlaneGeometry = new PlaneBufferGeometry(1, 1, 1, 1)
  }
  return __unitPlaneGeometry
}

const __sharedPlaneBufferGeometries = new Map<string, PlaneBufferGeometry>()
export function getSharedPlaneBufferGeometry(
  uniqueUvs = false,
  backside = false,
  offset?: Vector3
) {
  const key = offset ? `${offset.x};${offset.y};${offset.z}` : 'default'
  if (!__sharedPlaneBufferGeometries.has(key)) {
    const geo = new PlaneBufferGeometry(1, 1, 1, 1)
    if (offset) {
      const posArr = geo.attributes.position.array as Float32Array
      for (let i = 0; i < posArr.length; i += 3) {
        posArr[i] += offset.x
        posArr[i + 1] += offset.y
        posArr[i + 2] += offset.z
      }
    }
    if (backside) {
      const faceArr = geo.index.array as Uint32Array
      for (let i = 0; i < faceArr.length; i += 3) {
        const temp = faceArr[i]
        faceArr[i] = faceArr[i + 1]
        faceArr[i + 1] = temp
      }
    }
    __sharedPlaneBufferGeometries.set(key, geo)
  }
  const geo = __sharedPlaneBufferGeometries.get(key)!
  if (!uniqueUvs) {
    return geo
  } else {
    const clone = geo!.clone()
    clone.attributes.position = geo.attributes.position
    clone.attributes.normal = geo.attributes.normal
    return clone
  }
}
import ClipSurfaceGeometry from '../geometry/ClipSurfaceGeometry'

let __clipSurfaceGeometry: ClipSurfaceGeometry | undefined
export function getCachedClipSurfaceGeometry() {
  if (!__clipSurfaceGeometry) {
    __clipSurfaceGeometry = new ClipSurfaceGeometry()
  }
  return __clipSurfaceGeometry
}
