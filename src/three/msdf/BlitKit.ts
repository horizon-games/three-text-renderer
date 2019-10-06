import {
  Mesh,
  OrthographicCamera,
  RawShaderMaterial,
  Scene,
  Texture,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'

import BasicMapMeshMaterial from '../materials/BasicMapMeshMaterial'
import { getCachedClipSurfaceGeometry } from '../utils/geometry'
export interface DoubleBufferRawShaderMaterial extends RawShaderMaterial {
  backBufferTexture: Texture
  newTexture: Texture
}

export default class BlitKit {
  private _scene = new Scene()
  private _camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1)
  private _material: BasicMapMeshMaterial
  constructor(
    srcTexture: Texture,
    private _dstRenderTarget: WebGLRenderTarget
  ) {
    const material = new BasicMapMeshMaterial(srcTexture)
    const surface = new Mesh(getCachedClipSurfaceGeometry(), material)
    surface.frustumCulled = false
    this._scene.add(surface)
    this._camera.layers.mask = 0xffffffff
    this._scene.add(this._camera)
    this._material = material
  }
  render(renderer: WebGLRenderer, viewportData?: Vector4) {
    if (viewportData) {
      this._dstRenderTarget.viewport.set(
        viewportData.x,
        viewportData.y,
        viewportData.z,
        viewportData.w
      )
      this._dstRenderTarget.scissor.set(
        viewportData.x,
        viewportData.y,
        viewportData.z,
        viewportData.w
      )
      this._dstRenderTarget.scissorTest = true
    }
    renderer.setRenderTarget(this._dstRenderTarget)
    renderer.clear(true, true)
    renderer.render(this._scene, this._camera)
    renderer.setRenderTarget(null)
  }
  set texture(val: Texture) {
    this._material.texture = val
  }
}
