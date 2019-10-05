import {
  Color,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector2,
  WebGLRenderer
} from 'three'

// import { nextHighestPowerOfTwo } from '../../utils/math'
import TestMSDFMaterial from '../materials/TestMSDFMaterial'
import { getCachedUnitPlaneGeometry } from '../utils/geometry'
import { makeTexturePreviewMaterial } from '../utils/threeUtils'

import MSDFCombinerKit from './MSDFCombinerKit'
import SDFKit from './SDFKit'
export const COLOR_GRAY: Readonly<Color> = new Color(0.5, 0.5, 0.5)

export default class MSDFKit {
  get texture() {
    return this._combiner.finalTexture
  }
  get previewMeshMSDFMaterial() {
    if (!this._previewMeshMSDFMaterial) {
      this._previewMeshMSDFMaterial = makeTexturePreviewMaterial(
        this._combiner.finalTexture
      )
    }
    return this._previewMeshMSDFMaterial
  }
  get previewMeshTestMSDFMaterial() {
    if (!this._previewMeshTestMSDFMaterial) {
      this._previewMeshTestMSDFMaterial = new TestMSDFMaterial(
        this._combiner.finalTexture,
        this._width,
        this._height,
        this._pixelDensity
      )
    }
    return this._previewMeshTestMSDFMaterial
  }
  private _sdfKits: SDFKit[] = []
  private _combiner: MSDFCombinerKit
  private lineCount = 0
  private _previewMeshMSDFMaterial: MeshBasicMaterial | undefined
  private _previewMeshTestMSDFMaterial: TestMSDFMaterial | undefined
  constructor(
    private _width = 64,
    private _height = 64,
    private _pixelDensity: number = 1
  ) {
    const sdfKits: SDFKit[] = []
    for (let i = 0; i < 3; i++) {
      sdfKits.push(new SDFKit(_width, _height))
    }
    const combiner = new MSDFCombinerKit(_width, _height)
    this._sdfKits = sdfKits
    this._combiner = combiner
  }
  add(mesh: Mesh) {
    this._sdfKits[this.lineCount % this._sdfKits.length].add(mesh)
    this._sdfKits[(this.lineCount + 1) % this._sdfKits.length].add(mesh)
    // this._sdfKits[(this.lineCount+2) % this._sdfKits.length].add(mesh)
    this.lineCount++
  }
  render(renderer: WebGLRenderer) {
    for (const sdfKit of this._sdfKits) {
      sdfKit.render(renderer)
    }
    this._combiner.texture1 = this._sdfKits[0].lastRender
    this._combiner.texture2 = this._sdfKits[1].lastRender
    this._combiner.texture3 = this._sdfKits[2].lastRender
    this._combiner.render(renderer)
    renderer.setRenderTarget(null)
  }

  getPreviewMeshMSDF() {
    const pm = new Mesh(
      getCachedUnitPlaneGeometry(),
      this.previewMeshMSDFMaterial
    )
    pm.rotation.x = Math.PI
    pm.renderOrder = 9999
    return pm
  }
  getPreviewMeshTestMSDF() {
    const pm = new Mesh(
      getCachedUnitPlaneGeometry(),
      this.previewMeshTestMSDFMaterial
    )
    return pm
  }
  getPreviewMeshChannels() {
    const pivot = new Object3D()
    const previews: Object3D[] = []
    for (const sdfKit of this._sdfKits) {
      const pm = sdfKit.getPreviewMeshChannels()
      previews.push(pm)
      pivot.add(pm)
    }
    for (let i = 0; i < previews.length; i++) {
      const pm = previews[i]
      pm.position.x = i + 0.5 - previews.length * 0.5
    }
    return pivot
  }
  resize(size: Vector2, pixelDensity: number) {
    this._pixelDensity = pixelDensity
    size.width = Math.ceil(size.width)
    size.height = Math.ceil(size.height)
    //TODO size up to next highest power of two, and try to use a small pool of these to prevent creation of hundreds of textures
    // size.width = nextHighestPowerOfTwo(size.width)
    // size.height = nextHighestPowerOfTwo(size.height)
    if (this._width !== size.width || this._height !== size.height) {
      if (this._combiner.resize(size)) {
        for (const sdf of this._sdfKits) {
          sdf.resize(size)
        }
        if (this._previewMeshMSDFMaterial) {
          this._previewMeshMSDFMaterial.map = this._combiner.finalTexture
        }
        if (this._previewMeshTestMSDFMaterial) {
          this._previewMeshTestMSDFMaterial.texture = this._combiner.finalTexture
          this._previewMeshTestMSDFMaterial.resize(size, pixelDensity)
        }
      }
      this._width = size.width
      this._height = size.height
    }
  }
}
