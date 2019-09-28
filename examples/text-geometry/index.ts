import TextRenderer from '../../src/index'
import ScheherazadeBold from '../fonts/Scheherazade-Bold.ttf'

import { TextDirection, TextOptions } from '../../src/TextOptions'
import {
  Scene,
  OrthographicCamera,
  Mesh,
  WebGLRenderer,
  MeshBasicMaterial,
  DoubleSide,
  Box3Helper,
  Color
} from 'three'

async function main() {
  const scene = new Scene()
  const renderer = new WebGLRenderer()
  document.body.appendChild(renderer.domElement)
  renderer.setSize(window.innerWidth, window.innerHeight)

  const textRenderer = new TextRenderer()

  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)

  const testString = 'مرحبا'
  const fontSize = 92
  const options: TextOptions = {
    fontFace: 'Scheherazade-Bold',
    fontSize,
    lang: 'ar',
    direction: TextDirection.RTL
  }

  const geometry = await textRenderer.createTextGeometry(testString, options)
  console.log(geometry)

  const { boundingBox } = geometry

  console.log(boundingBox)

  const camera = new OrthographicCamera(
    window.innerWidth / -2,
    window.innerWidth / 2,
    window.innerHeight / -2,
    window.innerHeight / 2,
    window.innerWidth / -2,
    window.innerWidth / 2
  )
  camera.position.z = 5
  scene.add(camera)

  const mesh = new Mesh(
    geometry,
    new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide })
  )
  scene.add(mesh)

  const box = new Box3Helper(boundingBox, new Color(0x00ff00))
  mesh.add(box)

  const width = Math.abs(boundingBox.min.x - boundingBox.max.x)
  geometry.translate(-width / 2, 0, 0)

  const loop = () => {
    renderer.render(scene, camera)

    requestAnimationFrame(loop)

    mesh.rotation.x += 0.01
    mesh.rotation.y += 0.01
    mesh.rotation.z += 0.01
  }

  requestAnimationFrame(loop)
}

main()
