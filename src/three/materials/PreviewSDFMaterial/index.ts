import { DoubleSide, RawShaderMaterial, Texture, Uniform } from 'three'

import fragmentShader from './frag.glsl'
import vertexShader from './vert.glsl'

export default class PreviewSDFMaterial extends RawShaderMaterial {
  _uSdf: Uniform
  constructor(texture: Texture) {
    const sdf = new Uniform(texture)
    const uniforms = {
      sdf
    }
    super({
      vertexShader,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
      transparent: true
    })
    this._uSdf = sdf
  }
  set texture(val: Texture) {
    this._uSdf.value = val
  }
}
