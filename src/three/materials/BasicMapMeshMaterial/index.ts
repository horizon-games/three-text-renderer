import {
  DoubleSide,
  MaterialParameters,
  RawShaderMaterial,
  ShaderMaterialParameters,
  Texture,
  Uniform
} from 'three'

import { copyDefaults } from '../../../utils/jsUtils'

import fragmentShader from './frag.glsl'
import vertexShader from './vert.glsl'

interface IUniforms {
  mapTexture: { value: Texture }
}

export default class BasicMapMeshMaterial extends RawShaderMaterial {
  private _uTexture: Uniform
  constructor(map: Texture, matOptions: MaterialParameters = {}) {
    copyDefaults(matOptions, {
      side: DoubleSide,
      transparent: false,
      depthWrite: false
    })

    const mapTexture = new Uniform(map)

    const uniforms: IUniforms = {
      mapTexture
    }

    const defines: any = {}

    const params: ShaderMaterialParameters = {
      defines,
      uniforms,
      vertexShader,
      fragmentShader,
      ...matOptions
    }

    super(params)
    this._uTexture = mapTexture
  }
  set texture(val: Texture) {
    this._uTexture.value = val
  }
}
