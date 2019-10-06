import {
  LinearEncoding,
  LinearFilter,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  RGBAFormat,
  Scene,
  Texture,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'

import { COLOR_BLACK } from '../colorLibrary'
import MSDFCombinerMaterial from '../materials/MSDFCombinerMaterial'
import { getCachedClipSurfaceGeometry } from '../utils/geometry'

export default class MSDFCombinerKit {
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
  private _scene = new Scene()
  private _camera = new OrthographicCamera(-1, 1, -1, 1, -1, 1)
  private _material: MSDFCombinerMaterial
  private _finalTarget: WebGLRenderTarget
  constructor(
    private _width = 64,
    private _height = 64,
    private _smoothForDirectUse = true
  ) {
    this._finalTarget = this.regenerateRenderTarget(_width, _height)

    const material = new MSDFCombinerMaterial()
    const surface = new Mesh(getCachedClipSurfaceGeometry(), material)
    surface.frustumCulled = false
    this._scene.add(surface)
    this._scene.add(this._camera)
    this._material = material
  }
  render(renderer: WebGLRenderer) {
    renderer.setRenderTarget(this._finalTarget)
    renderer.setClearColor(COLOR_BLACK)
    renderer.render(this._scene, this._camera)
  }
  resize(size: Vector2) {
    if (size.width !== this._width || size.height !== this._height) {
      this._finalTarget = this.regenerateRenderTarget(size.width, size.height)
      this._width = size.width
      this._height = size.height
      return true
    } else {
      return false
    }
  }
  private regenerateRenderTarget(width: number, height: number) {
    const filter = this._smoothForDirectUse ? LinearFilter : NearestFilter
    const finalTarget = new WebGLRenderTarget(width, height, {
      depthBuffer: true,
      stencilBuffer: false,
      magFilter: filter,
      minFilter: filter,
      format: RGBAFormat
    })
    finalTarget.texture.encoding = LinearEncoding
    return finalTarget
  }
}
