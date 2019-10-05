import { DoubleSide, RawShaderMaterial, Uniform, Vector2, Vector4 } from 'three'

import fragmentShader from './frag.glsl'
import vertexShader from './vert.glsl'

export type CurveType = 'bezier' | 'quadratic' | 'linear'

export default class SDFCurveMaterial extends RawShaderMaterial {
  _vAHHAx: Vector4
  _vAHHAy: Vector4
  _uPadding: Uniform
  constructor(type: CurveType, windingOrder: 1 | -1, padding: number = 1) {
    const vAHHAx = new Vector4(0, 0.25, 1.75, 2)
    const vAHHAy = new Vector4(0, 1, 1, 0)
    const uPadding = new Uniform(padding)
    const uniforms = {
      AHHAx: new Uniform(vAHHAx),
      AHHAy: new Uniform(vAHHAy),
      padding: uPadding,
      windingOrder: new Uniform(windingOrder)
    }
    const defines: any = {}
    switch (type) {
      case 'linear':
        defines.USE_LINEAR = true
        break
      case 'bezier':
        defines.USE_BEZIER = true
        break
      case 'quadratic':
        defines.USE_QUADRATIC = true
        break
    }
    super({
      defines,
      fragmentShader,
      vertexShader,
      uniforms,
      side: DoubleSide,
      depthTest: true,
      depthWrite: true
    })
    this._vAHHAx = vAHHAx
    this._vAHHAy = vAHHAy
    this._uPadding = uPadding
  }
  setAnchor1(x: number, y: number) {
    this._vAHHAx.x = x
    this._vAHHAy.x = y
  }
  setHandle1(x: number, y: number) {
    this._vAHHAx.y = x
    this._vAHHAy.y = y
  }
  setHandle2(x: number, y: number) {
    this._vAHHAx.z = x
    this._vAHHAy.z = y
  }
  setAnchor2(x: number, y: number) {
    this._vAHHAx.w = x
    this._vAHHAy.w = y
  }
  offsetHandle1(x: number, y: number) {
    this._vAHHAx.y += x
    this._vAHHAy.y += y
  }
  offsetHandle2(x: number, y: number) {
    this._vAHHAx.z += x
    this._vAHHAy.z += y
  }
  transform(offset: Vector2, scale: number) {
    this._vAHHAx.x = this._vAHHAx.x * scale + offset.x
    this._vAHHAx.y = this._vAHHAx.y * scale + offset.x
    this._vAHHAx.z = this._vAHHAx.z * scale + offset.x
    this._vAHHAx.w = this._vAHHAx.w * scale + offset.x

    this._vAHHAy.x = this._vAHHAy.x * scale + offset.y
    this._vAHHAy.y = this._vAHHAy.y * scale + offset.y
    this._vAHHAy.z = this._vAHHAy.z * scale + offset.y
    this._vAHHAy.w = this._vAHHAy.w * scale + offset.y
  }
  set padding(value: number) {
    this._uPadding.value = value
  }
}
