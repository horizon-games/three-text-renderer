import { DoubleSide, RawShaderMaterial, Texture, Uniform } from 'three'

import fragmentShader from './frag.glsl'
import vertexShader from './vert.glsl'

export default class TestMSDFMaterial extends RawShaderMaterial {
  constructor(texture: Texture) {
    const uniforms = {
      contrastMultiplier: new Uniform(1),
      msdf: new Uniform(texture)
    }
    super({
      vertexShader,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      side: DoubleSide
    })
  }
}
