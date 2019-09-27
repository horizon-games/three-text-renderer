import { DoubleSide, RawShaderMaterial, Texture, Uniform } from 'three'
import { DoubleBufferRawShaderMaterial } from '~/helpers/DoubleBufferBlitKit'

import fragmentShader from './frag.glsl'
import vertexShader from './vert.glsl'

export default class SDFCombinerDBMaterial extends RawShaderMaterial
  implements DoubleBufferRawShaderMaterial {
  private _backBufferTextureUniform: Uniform
  private _newTextureUniform: Uniform
  constructor(newTexture: Texture) {
    const backBufferTextureUniform = new Uniform(null)
    const newTextureUniform = new Uniform(newTexture)
    const uniforms = {
      backBufferTexture: backBufferTextureUniform,
      newTexture: newTextureUniform
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
    this._backBufferTextureUniform = backBufferTextureUniform
    this._newTextureUniform = newTextureUniform
  }
  set newTexture(val: Texture) {
    this._newTextureUniform.value = val
  }
  get newTexture() {
    return this._newTextureUniform.value
  }
  set backBufferTexture(val: Texture) {
    this._backBufferTextureUniform.value = val
  }
  get backBufferTexture() {
    return this._backBufferTextureUniform.value
  }
}
