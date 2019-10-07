import {
  LinearEncoding,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
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
import TestMSDFMaterial from '../materials/TestMSDFMaterial'
import { getCachedUnitPlaneGeometry } from '../utils/geometry'
import { makeTexturePreviewMaterial } from '../utils/threeUtils'

import DoubleBufferBlitKit from './DoubleBufferBlitKit'
import { ISDFKit } from './ISDFKit'

export default class SDFKit implements ISDFKit {
  get texture() {
    return this._blitKit.backBufferTarget.texture
  }
  get getRawPreviewMaterial() {
    if (!this._getRawPreviewMaterial) {
      this._getRawPreviewMaterial = makeTexturePreviewMaterial(this.texture)
    }
    return this._getRawPreviewMaterial
  }
  get getSDFTestPreviewMaterial() {
    if (!this._getSDFTestPreviewMaterial) {
      this._getSDFTestPreviewMaterial = new TestMSDFMaterial(
        this.texture,
        this._width,
        this._height,
        this._pixelDensity,
        0.5,
        'sdf'
      )
    }
    return this._getSDFTestPreviewMaterial
  }
  private _scene = new Scene()
  private _camera: OrthographicCamera
  private _lineSegments: Mesh[] = []
  private _blitKit: DoubleBufferBlitKit
  private _tempTarget: WebGLRenderTarget
  private _previewSDFMaterials: PreviewSDFMaterial[] = []
  private _getRawPreviewMaterial: MeshBasicMaterial | undefined
  private _getSDFTestPreviewMaterial: TestMSDFMaterial | undefined
  constructor(
    private _width = 64,
    private _height = 64,
    private _pixelDensity: number = 1,
    private _smoothForDirectUse = true
  ) {
    const tempTarget = this.regenerateRenderTarget(_width, _height)
    this._camera = new OrthographicCamera(0, _width, -_height, 0, 100, -100)
    this._camera.rotation.x = Math.PI * 0.5
    this._scene.add(this._camera)
    const blitKitMat = new SDFCombinerDBMaterial(tempTarget.texture)
    const blitKit = new DoubleBufferBlitKit(
      _width,
      _height,
      blitKitMat,
      _smoothForDirectUse
    )
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
  getRawPreviewMesh() {
    const pm = new Mesh(
      getCachedUnitPlaneGeometry(),
      this.getRawPreviewMaterial
    )
    pm.rotation.x = Math.PI
    pm.renderOrder = 9999
    return pm
  }
  getSDFTestPreviewMesh() {
    const pm = new Mesh(
      getCachedUnitPlaneGeometry(),
      this.getSDFTestPreviewMaterial
    )
    return pm
  }
  getChannelsPreviewMesh() {
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
  resize(size: Vector2, pixelDensity: number) {
    if (size.width !== this._width || size.height !== this._height) {
      this._width = size.width
      this._height = size.height
      this._pixelDensity = pixelDensity
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
    const filter = this._smoothForDirectUse ? LinearFilter : NearestFilter
    const rt = new WebGLRenderTarget(width, height, {
      depthBuffer: true,
      stencilBuffer: false,
      magFilter: filter,
      minFilter: filter,
      format: RGBAFormat
    })
    rt.texture.encoding = LinearEncoding
    return rt
  }
}
