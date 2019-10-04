import { DoubleSide, MeshBasicMaterial, Texture } from 'three'

export function makeTexturePreviewMaterial(map: Texture) {
  return new MeshBasicMaterial({
    // color:0xff0000,
    map,
    depthTest: false,
    depthWrite: false,
    side: DoubleSide
    // transparent: true
  })
}
