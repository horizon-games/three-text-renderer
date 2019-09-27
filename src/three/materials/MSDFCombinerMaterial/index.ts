import { DoubleSide, RawShaderMaterial, Texture, Uniform } from 'three'

import fragmentShader from './frag.glsl'
import vertexShader from './vert.glsl'

export default class MSDFCombinerMaterial extends RawShaderMaterial {
  private _texture1: Uniform
  private _texture2: Uniform
  private _texture3: Uniform
  constructor() {
    const texture1 = new Uniform(null)
    const texture2 = new Uniform(null)
    const texture3 = new Uniform(null)
    const uniforms = {
      texture1,
      texture2,
      texture3
    }
    super({
      vertexShader,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide
    })
    this._texture1 = texture1
    this._texture2 = texture2
    this._texture3 = texture3
  }
  set texture1(val: Texture) {
    this._texture1.value = val
  }
  set texture2(val: Texture) {
    this._texture2.value = val
  }
  set texture3(val: Texture) {
    this._texture3.value = val
  }
}
