import { Color, Vector2, WebGLRenderer } from 'three'

import { TtfPathSegment } from '../../examples/common/testFontPathData'
import { PackedBin } from '../BinPacker'
import { ShapedGlyph } from '../TextRenderer'

import MSDFKit from './msdf/MSDFKit'
import TextureAtlas from './TextureAtlas'
import { makeTtfShapeMeshes } from './utils/ttfHelpers'

class QueuedGlyph {
  constructor(
    public glyph: string,
    public size: Vector2,
    public ttfPath: TtfPathSegment[],
    public packInfo: PackedBin,
    public uvs: number[]
  ) {
    //
  }
}

const msAllowedPerBatch = 5
const __tempColor = new Color()
export default class MDSFAtlas {
  private _msdfKit: MSDFKit
  private _atlas: TextureAtlas
  private _queue: string[] = []
  private _queueData = new Map<string, QueuedGlyph>()
  get texture() {
    return this._msdfKit.texture
  }
  constructor(size = 2048) {
    this._msdfKit = new MSDFKit()
    this._atlas = new TextureAtlas(size)
  }
  render(renderer: WebGLRenderer) {
    if (this._queue.length > 0) {
      __tempColor.copy(renderer.getClearColor())
      const timeStart = performance.now()
      while (this._queue.length > 0) {
        const glyphId = this._queue.shift()!
        const data = this._queueData.get(glyphId)!
        for (const curveMesh of makeTtfShapeMeshes(
          data.ttfPath,
          undefined,
          0.01
        )) {
          this._msdfKit.add(curveMesh)
        }
        this._msdfKit.render(renderer)
        this._queueData.delete(glyphId)
        if (performance.now() - timeStart > msAllowedPerBatch) {
          break
        }
      }
      renderer.setClearColor(__tempColor)
    }
  }
  getPreviewMeshMSDF() {
    return this._msdfKit.getPreviewMeshMSDF()
  }
  addTtfGlyph(shapedGlyph: ShapedGlyph) {
    const { shaping, path } = shapedGlyph
    const id = `${shaping.fontIndex}:${shaping.glyphId}`
    if (this._queue.includes(id)) {
      return this._queueData.get(id)!.uvs
    }
    const bb = path!.getBoundingBox()
    this._queue.push(id)
    const size = new Vector2(bb.x2 - bb.x1, bb.y2 - bb.y1)
    const packInfo = this._atlas.findSpace(size)
    const uvs = [0, 0, 0, 1, 1, 1, 1, 0]
    this._queueData.set(
      id,
      new QueuedGlyph(
        id,
        size,
        path!.commands as TtfPathSegment[],
        packInfo,
        uvs
      )
    )
    return uvs
  }
}
