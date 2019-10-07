import { Mesh, Object3D, Texture, Vector2, WebGLRenderer } from 'three'

export interface ISDFKit {
  readonly texture: Texture
  add(mesh: Mesh): void
  resize(size: Vector2, pixelDensity: number): void
  render(renderer: WebGLRenderer): void
  getRawPreviewMesh(): Object3D
  getSDFTestPreviewMesh(): Object3D
  getChannelsPreviewMesh(): Object3D
}
