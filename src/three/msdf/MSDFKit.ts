import { Color, Mesh, Object3D, WebGLRenderer } from 'three'

import TestMSDFMaterial from '../materials/TestMSDFMaterial'
import { getCachedUnitPlaneGeometry } from '../utils/geometry'
import { makeTexturePreviewMaterial } from '../utils/threeUtils'

import MSDFCombinerKit from './MSDFCombinerKit'
import SDFKit from './SDFKit'
export const COLOR_GRAY: Readonly<Color> = new Color(0.5, 0.5, 0.5)

export default class MSDFKit {
  private _sdfKits: SDFKit[] = []
  private _combiner: MSDFCombinerKit
  private lineCount = 0
  constructor() {
    const sdfKits: SDFKit[] = []
    for (let i = 0; i < 3; i++) {
      sdfKits.push(new SDFKit())
    }
    const combiner = new MSDFCombinerKit()
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
  getPreviewMesh() {
    const pm = new Mesh(
      getCachedUnitPlaneGeometry(),
      makeTexturePreviewMaterial(this._combiner.finalTexture)
    )
    return pm
  }
  getPreviewMeshTestMSDF() {
    const pm = new Mesh(
      getCachedUnitPlaneGeometry(),
      new TestMSDFMaterial(this._combiner.finalTexture)
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
}
