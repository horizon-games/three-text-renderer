import {
  Mesh,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'

export default class PrerenderKit {
  private _scene = new Scene()
  private _camera = new OrthographicCamera(-1, 1, -1, 1, -1, 1)
  private _queue: Mesh[] = []
  private _rt = new WebGLRenderTarget(32, 32, {
    depthBuffer: false,
    stencilBuffer: false
  })
  constructor() {
    this._camera.layers.mask = 0xffffffff
    this._scene.add(this._camera)
  }
  add(mesh: Mesh) {
    this._queue.push(new Mesh(mesh.geometry, mesh.material))
  }
  render(renderer: WebGLRenderer) {
    if (this._queue.length > 0) {
      for (const m of this._queue) {
        this._scene.add(m)
      }
      renderer.setRenderTarget(this._rt)
      renderer.render(this._scene, this._camera)
      renderer.setRenderTarget(null)
      for (const m of this._queue) {
        this._scene.remove(m)
      }
      this._queue.length = 0
    }
  }
}
