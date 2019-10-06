import {
  LinearEncoding,
  LinearFilter,
  RGBFormat,
  Vector2,
  WebGLRenderTarget
} from 'three'

import BinPacker from '../BinPacker'

export default class TextureAtlas {
  private _binPacker: BinPacker
  private _renderTarget: WebGLRenderTarget
  get texture() {
    return this._renderTarget.texture
  }
  get renderTarget() {
    return this._renderTarget
  }
  constructor(size = 2048) {
    this._renderTarget = new WebGLRenderTarget(size, size, {
      format: RGBFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      generateMipmaps: false
    })
    this.texture.encoding = LinearEncoding
    this._binPacker = new BinPacker(size, size)
  }
  findSpace(size: Vector2, allowRotation: boolean) {
    return this._binPacker.add(size, allowRotation)
  }
}
