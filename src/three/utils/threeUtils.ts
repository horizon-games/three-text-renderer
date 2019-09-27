import { MeshBasicMaterial, Texture } from 'three'

export function makeTexturePreviewMaterial(map: Texture) {
  return new MeshBasicMaterial({
    map,
    depthTest: false,
    depthWrite: false
    // transparent: true
  })
}
