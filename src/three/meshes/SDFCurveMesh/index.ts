import { Mesh, Vector2 } from 'three'

import SDFCurveGeometry from './Geometry'
import SDFCurveMaterial, { CurveType } from './Material'

const __geos = new Map<string, SDFCurveGeometry>()
function __getCachedGeo(segments: number) {
  const key = segments.toString()
  if (!__geos.has(key)) {
    __geos.set(key, new SDFCurveGeometry(segments))
  }
  return __geos.get(key)!
}

export default class SDFCurveMesh extends Mesh {
  private _material: SDFCurveMaterial
  constructor(type: CurveType, segments: number, windingOrder: 1 | -1) {
    const mat = new SDFCurveMaterial(type, windingOrder)
    const geo = __getCachedGeo(segments)
    super(geo, mat)
    this._material = mat
  }
  setAnchor1v(v: Vector2) {
    this.setAnchor1(v.x, v.y)
  }
  setAnchor2v(v: Vector2) {
    this.setAnchor2(v.x, v.y)
  }
  setHandle1v(v: Vector2) {
    this.setHandle1(v.x, v.y)
  }
  setHandle2v(v: Vector2) {
    this.setHandle2(v.x, v.y)
  }
  setAnchor1(x: number, y: number) {
    this._material.setAnchor1(x, y)
  }
  setHandle1(x: number, y: number) {
    this._material.setHandle1(x, y)
  }
  setHandle2(x: number, y: number) {
    this._material.setHandle2(x, y)
  }
  setAnchor2(x: number, y: number) {
    this._material.setAnchor2(x, y)
  }
  offsetHandle1(x: number, y: number) {
    this._material.offsetHandle1(x, y)
  }
  offsetHandle2(x: number, y: number) {
    this._material.offsetHandle2(x, y)
  }
  transform(offset: Vector2, scale: number) {
    this._material.transform(offset, scale)
  }
}
