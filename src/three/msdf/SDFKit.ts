import {
  LinearEncoding,
  Mesh,
  NearestFilter,
  Object3D,
  OrthographicCamera,
  RawShaderMaterial,
  RGBAFormat,
  Scene,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'

import { COLOR_WHITE } from '../colorLibrary'
import PreviewSDFMaterial from '../materials/PreviewSDFMaterial'
import SDFCombinerDBMaterial from '../materials/SDFCombinerDBMaterial'
import { getCachedUnitPlaneGeometry } from '../utils/geometry'
import { makeTexturePreviewMaterial } from '../utils/threeUtils'

import DoubleBufferBlitKit from './DoubleBufferBlitKit'

const camScale = 64
export default class SDFKit {
  private _scene = new Scene()
  private _camera = new OrthographicCamera(
    0,
    camScale,
    -camScale,
    0,
    camScale * 2,
    -camScale * 2
  )
  private _lineSegments: Mesh[] = []
  private _blitKit: DoubleBufferBlitKit
  private _tempTarget: WebGLRenderTarget
  constructor() {
    const tempTarget = new WebGLRenderTarget(64, 64, {
      depthBuffer: true,
      stencilBuffer: false,
      magFilter: NearestFilter,
      minFilter: NearestFilter,
      format: RGBAFormat
    })
    tempTarget.texture.encoding = LinearEncoding
    this._camera.rotation.x = Math.PI * 0.5
    this._scene.add(this._camera)
    const blitKitMat = new SDFCombinerDBMaterial(tempTarget.texture)
    const blitKit = new DoubleBufferBlitKit(blitKitMat)
    this._blitKit = blitKit
    this._tempTarget = tempTarget
  }
  add(mesh: Mesh) {
    this._lineSegments.push(new Mesh(mesh.geometry, mesh.material))
  }
  render(renderer: WebGLRenderer) {
    const lines = this._lineSegments
    if (lines.length > 0) {
      function clearRT(rt: WebGLRenderTarget) {
        renderer.setRenderTarget(rt)
        renderer.setClearColor(COLOR_WHITE, 0.0)
        renderer.clearDepth()
        renderer.clearColor()
      }
      clearRT(this._blitKit.backBufferTarget)
      clearRT(this._blitKit.frontBufferTarget)
      for (const l of lines) {
        clearRT(this._tempTarget)
        this._scene.add(l)
        const mat = l.material as RawShaderMaterial
        mat.depthTest = true
        mat.depthWrite = true
        renderer.render(this._scene, this._camera)
        this._scene.remove(l)
        this._blitKit.render(renderer)
        this._blitKit.swap()
      }
      renderer.setRenderTarget(null)
    }
    this._lineSegments.length = 0
  }
  getPreviewMeshChannels() {
    const pivot = new Object3D()
    const meshes: Mesh[] = []
    function m(t: Texture, sdf = false) {
      const pm = new Mesh(
        getCachedUnitPlaneGeometry(),
        sdf ? new PreviewSDFMaterial(t) : makeTexturePreviewMaterial(t)
      )
      meshes.push(pm)
      pivot.add(pm)
    }
    m(this._blitKit.backBufferTarget.texture, true)
    m(this._blitKit.frontBufferTarget.texture, true)
    m(this._tempTarget.texture, true)
    for (let i = 0; i < meshes.length; i++) {
      const pm = meshes[i]
      pm.position.y = i + 0.5 - meshes.length * 0.5
    }
    return pivot
  }

  get lastRender() {
    return this._blitKit.backBufferTarget.texture
  }
}
