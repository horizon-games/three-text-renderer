import {
  LinearEncoding,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  RGBAFormat,
  Scene,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'

import MSDFCombinerMaterial from '../materials/MSDFCombinerMaterial'
import { getCachedClipSurfaceGeometry } from '../utils/geometry'

export default class MSDFCombinerKit {
  private _scene = new Scene()
  private _camera = new OrthographicCamera(-1, 1, -1, 1, -1, 1)
  private _material: MSDFCombinerMaterial
  private _finalTarget: WebGLRenderTarget
  constructor() {
    const finalTarget = new WebGLRenderTarget(64, 64, {
      depthBuffer: true,
      stencilBuffer: false,
      magFilter: LinearFilter,
      minFilter: LinearFilter,
      format: RGBAFormat
    })
    finalTarget.texture.encoding = LinearEncoding

    const material = new MSDFCombinerMaterial()
    const surface = new Mesh(getCachedClipSurfaceGeometry(), material)
    surface.frustumCulled = false
    this._scene.add(surface)
    this._scene.add(this._camera)
    this._material = material
    this._finalTarget = finalTarget
  }
  render(renderer: WebGLRenderer) {
    renderer.setRenderTarget(this._finalTarget)
    renderer.render(this._scene, this._camera)
  }
  set texture1(val: Texture) {
    this._material.texture1 = val
  }
  set texture2(val: Texture) {
    this._material.texture2 = val
  }
  set texture3(val: Texture) {
    this._material.texture3 = val
  }
  get finalTexture() {
    return this._finalTarget.texture
  }
}
