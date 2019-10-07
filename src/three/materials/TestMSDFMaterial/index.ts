import { DoubleSide, RawShaderMaterial, Texture, Uniform, Vector2 } from 'three'

import fragmentShader from './frag.glsl'
import vertexShader from './vert.glsl'

export default class TestMSDFMaterial extends RawShaderMaterial {
  private _uMsdf: Uniform
  private _gridSize: Vector2
  constructor(
    texture: Texture,
    width = 64,
    height = 64,
    pixelDensity: number,
    contrastMultiplier: number,
    mode: 'sdf' | 'msdf'
  ) {
    const msdf = new Uniform(texture)
    const gridSize = new Vector2(width / pixelDensity, height / pixelDensity)
    const uniforms = {
      contrastMultiplier: new Uniform(contrastMultiplier),
      gridSize: new Uniform(gridSize),
      msdf
    }
    const defines: any = {}
    if (mode === 'sdf') {
      defines.USE_SDF = true
    } else {
      defines.USE_MSDF = true
    }
    super({
      defines,
      vertexShader,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      side: DoubleSide
    })
    this._uMsdf = msdf
    this._gridSize = gridSize
  }
  set texture(val: Texture) {
    this._uMsdf.value = val
  }
  resize(size: Vector2, pixelDensity: number) {
    this._gridSize.copy(size).multiplyScalar(1 / pixelDensity)
  }
}
