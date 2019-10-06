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
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'

import { COLOR_BLACK } from '../colorLibrary'
import PreviewSDFMaterial from '../materials/PreviewSDFMaterial'
import SDFCombinerDBMaterial from '../materials/SDFCombinerDBMaterial'
import { getCachedUnitPlaneGeometry } from '../utils/geometry'

import DoubleBufferBlitKit from './DoubleBufferBlitKit'

export default class SDFKit {
  get lastRender() {
    return this._blitKit.backBufferTarget.texture
  }
  private _scene = new Scene()
  private _camera: OrthographicCamera
  private _lineSegments: Mesh[] = []
  private _blitKit: DoubleBufferBlitKit
  private _tempTarget: WebGLRenderTarget
  private _previewSDFMaterials: PreviewSDFMaterial[] = []
  constructor(private _width = 64, private _height = 64) {
    const tempTarget = this.regenerateRenderTarget(_width, _height)
    this._camera = new OrthographicCamera(0, _width, -_height, 0, 100, -100)
    this._camera.rotation.x = Math.PI * 0.5
    this._scene.add(this._camera)
    const blitKitMat = new SDFCombinerDBMaterial(tempTarget.texture)
    const blitKit = new DoubleBufferBlitKit(_width, _height, blitKitMat)
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
        renderer.setClearColor(COLOR_BLACK, 0.0)
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
    const mats = this._previewSDFMaterials
    function m(t: Texture, i: number) {
      if (!mats[i]) {
        mats[i] = new PreviewSDFMaterial(t)
      }
      const pm = new Mesh(getCachedUnitPlaneGeometry(), mats[i])
      meshes.push(pm)
      pivot.add(pm)
    }
    m(this._blitKit.backBufferTarget.texture, 0)
    m(this._blitKit.frontBufferTarget.texture, 1)
    m(this._tempTarget.texture, 2)
    for (let i = 0; i < meshes.length; i++) {
      const pm = meshes[i]
      pm.position.y = i + 0.5 - meshes.length * 0.5
    }
    return pivot
  }
  resize(size: Vector2) {
    if (size.width !== this._width || size.height !== this._height) {
      this._width = size.width
      this._height = size.height
      this._tempTarget = this.regenerateRenderTarget(size.width, size.height)
      this._blitKit.newDataTexture = this._tempTarget.texture
      this._blitKit.resize(size)

      const mats = this._previewSDFMaterials
      function m(t: Texture, i: number) {
        if (mats[i]) {
          mats[i].texture = t
        }
      }
      m(this._blitKit.backBufferTarget.texture, 0)
      m(this._blitKit.frontBufferTarget.texture, 1)
      m(this._tempTarget.texture, 2)

      this._camera.right = size.width
      this._camera.top = -size.height
      this._camera.updateProjectionMatrix()
      return true
    } else {
      return false
    }
  }
  private regenerateRenderTarget(width: number, height: number) {
    const rt = new WebGLRenderTarget(width, height, {
      depthBuffer: true,
      stencilBuffer: false,
      magFilter: NearestFilter,
      minFilter: NearestFilter,
      format: RGBAFormat
    })
    rt.texture.encoding = LinearEncoding
    return rt
  }
}
