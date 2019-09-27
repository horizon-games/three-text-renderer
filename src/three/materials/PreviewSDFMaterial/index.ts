import { DoubleSide, RawShaderMaterial, Texture, Uniform } from 'three'

import fragmentShader from './frag.glsl'
import vertexShader from './vert.glsl'

export default class PreviewSDFMaterial extends RawShaderMaterial {
  constructor(texture: Texture) {
    const uniforms = {
      sdf: new Uniform(texture)
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
  }
}
