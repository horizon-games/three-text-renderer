import {
  LinearEncoding,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  RawShaderMaterial,
  RGBAFormat,
  Scene,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'

import { getCachedClipSurfaceGeometry } from '../utils/geometry'
export interface DoubleBufferRawShaderMaterial extends RawShaderMaterial {
  backBufferTexture: Texture
  newTexture: Texture
}

function nrt() {
  const rt = new WebGLRenderTarget(64, 64, {
    depthBuffer: true,
    stencilBuffer: false,
    magFilter: NearestFilter,
    minFilter: NearestFilter,
    format: RGBAFormat
  })
  rt.texture.encoding = LinearEncoding
  return rt
}

export default class DoubleBufferBlitKit {
  private _scene = new Scene()
  private _camera = new OrthographicCamera(-1, 1, -1, 1, -1, 1)
  private _insistSwap = false
  constructor(
    private dbMaterial: DoubleBufferRawShaderMaterial,
    private _rt = nrt(),
    private _rt2 = nrt()
  ) {
    dbMaterial.backBufferTexture = this._rt.texture
    const surface = new Mesh(getCachedClipSurfaceGeometry(), dbMaterial)
    surface.frustumCulled = false
    this._scene.add(surface)
    this._camera.layers.mask = 0xffffffff
    this._scene.add(this._camera)
  }
  render(renderer: WebGLRenderer) {
    if (this._insistSwap) {
      throw new Error('you must swap between renders')
    }
    renderer.setRenderTarget(this.frontBufferTarget)
    renderer.render(this._scene, this._camera)
    this._insistSwap = true
  }
  swap() {
    const mat = this.dbMaterial
    const rtt1 = this._rt.texture
    const rtt2 = this._rt2.texture
    mat.backBufferTexture = mat.backBufferTexture === rtt1 ? rtt2 : rtt1
    this._insistSwap = false
  }
  get frontBufferTarget() {
    const rt1 = this._rt
    const rt2 = this._rt2
    return this.dbMaterial.backBufferTexture === rt1.texture ? rt2 : rt1
  }
  get backBufferTarget() {
    const rt1 = this._rt
    const rt2 = this._rt2
    return this.dbMaterial.backBufferTexture === rt1.texture ? rt1 : rt2
  }
  set newDataTexture(val: Texture) {
    this.dbMaterial.newTexture = val
  }
}
