
import ChamferedBoxBufferGeometry from '../geometry/ChamferedBoxBufferGeometry'

const __cachedChamferedBoxGeometry = new Map<
  string,
  ChamferedBoxBufferGeometry
>()
export function getCachedChamferedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  chamfer: number = 0.005
) {
  const key = `${width};${height};${depth};${chamfer};`
  if (!__cachedChamferedBoxGeometry.has(key)) {
    __cachedChamferedBoxGeometry.set(
      key,
      new ChamferedBoxBufferGeometry(width, height, depth, chamfer)
    )
  }
  return __cachedChamferedBoxGeometry.get(key)!
}
