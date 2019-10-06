import { Color, Mesh, MeshBasicMaterial, Vector2, WebGLRenderer } from 'three'

import { TtfPathSegment } from '../../examples/common/testFontPathData'
import { PackedBin } from '../BinPacker'
import { ShapedGlyph } from '../TextRenderer'

import BlitKit from './msdf/BlitKit'
import MSDFKit from './msdf/MSDFKit'
import TextureAtlas from './TextureAtlas'
import { getCachedUnitPlaneGeometry } from './utils/geometry'
import { makeTexturePreviewMaterial } from './utils/threeUtils'
import {
  makeTtfFontShapeMeshes
} from './utils/ttfHelpers'
// import { Path } from 'opentype.js'

class QueuedGlyph {
  constructor(
    public glyph: string,
    public fontSize: number,
    public padding: number,
    public prescale: number,
    public yDir: 1 | -1,
    public size: Vector2,
    public ttfPath: TtfPathSegment[],
    public packInfo: PackedBin,
    public uvs: number[]
  ) {
    //
  }
  getCompleted() {
    return new CompletedGlyph(this.glyph, this.packInfo, this.uvs)
  }
}

class CompletedGlyph {
  constructor(
    public glyph: string,
    public packInfo: PackedBin,
    public uvs: number[]
  ) {
    //
  }
}

const msAllowedPerBatch = 5
const __tempColor = new Color()
export default class MDSFAtlas {
  get texture() {
    return this._atlas.texture
  }
  get previewMeshMSDFMaterial() {
    if (!this._previewMeshMSDFMaterial) {
      this._previewMeshMSDFMaterial = makeTexturePreviewMaterial(
        this._atlas.texture
      )
    }
    return this._previewMeshMSDFMaterial
  }
  private _msdfKit: MSDFKit
  private _atlas: TextureAtlas
  private _queue: string[] = []
  private _queueData = new Map<string, QueuedGlyph>()
  private _completedData = new Map<string, CompletedGlyph>()
  private _glyphBlitter: BlitKit
  private _previewMeshMSDFMaterial: MeshBasicMaterial | undefined
  constructor(size = 2048, pixelDensity = 1, msdfKit?: MSDFKit) {
    this._msdfKit = msdfKit || new MSDFKit(64, 64, pixelDensity)
    this._atlas = new TextureAtlas(size)
    this._glyphBlitter = new BlitKit(
      this._msdfKit.texture,
      this._atlas.renderTarget
    )
  }
  render(renderer: WebGLRenderer) {
    if (this._queue.length > 0) {
      __tempColor.copy(renderer.getClearColor())
      const timeStart = performance.now()
      while (this._queue.length > 0) {
        const glyphId = this._queue.shift()!
        const data = this._queueData.get(glyphId)!
        const result = makeTtfFontShapeMeshes(
          data.ttfPath,
          data.fontSize,
          data.fontSize,
          data.padding,
          1,
          1,
          data.yDir
        )
        for (const curveMesh of result.meshes) {
          this._msdfKit.add(curveMesh)
        }
        this._msdfKit.resize(result.size, result.pixelDensity)
        this._glyphBlitter.texture = this._msdfKit.texture
        this._msdfKit.render(renderer)
        this._glyphBlitter.render(renderer, data.packInfo.getViewportData())
        this._queueData.delete(glyphId)
        this._completedData.set(glyphId, data.getCompleted())
        if (performance.now() - timeStart > msAllowedPerBatch) {
          break
        }
      }
      renderer.setClearColor(__tempColor)
    }
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
  addTtfGlyph(
    shapedGlyph: ShapedGlyph,
    fontSize: number,
    padding: number,
    yDir: 1 | -1
  ) {
    const { shaping, path } = shapedGlyph
    const id = `${shaping.fontIndex}:${shaping.glyphId}:${fontSize}:${padding}`
    if (this._completedData.has(id)) {
      return this._completedData.get(id)!.uvs
    }
    if (this._queueData.has(id)) {
      return this._queueData.get(id)!.uvs
    }
    const bb = path!.getBoundingBox()
    this._queue.push(id)
    const size = new Vector2(Math.ceil(bb.x2 - bb.x1), Math.ceil(bb.y2 - bb.y1))
    const packInfo = this._atlas.findSpace(size, false)
    const uvs = [0, 0, 0, 1, 1, 1, 1, 0]
    //unlike the msdf generator example, the commands in these glyphs are already prescaled
    const prescale = 1
    // const path2 = shapedGlyph.glyph.path
    // const prescale = fontSize / (path2 instanceof Path ? path2.unitsPerEm : path2().unitsPerEm)
    this._queueData.set(
      id,
      new QueuedGlyph(
        id,
        fontSize,
        padding,
        prescale,
        yDir,
        size,
        path!.commands as TtfPathSegment[],
        packInfo,
        uvs
      )
    )
    return uvs
  }
}
