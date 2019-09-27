import TextRenderer from '../../src/index'
import ScheherazadeBold from '../fonts/Scheherazade-Bold.ttf'

import * as opentype from 'opentype.js'
import { TextDirection, TextOptions } from '../../src/TextOptions'
import {
  Scene,
  OrthographicCamera,
  Mesh,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneBufferGeometry,
  DoubleSide
} from 'three'

async function main() {
  const textRenderer = new TextRenderer()

  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)

  const testString = 'مرحبا'
  const fontSize = 192
  const options: TextOptions = {
    fontFace: 'Scheherazade-Bold',
    fontSize,
    lang: 'ar',
    direction: TextDirection.RTL
  }

  const geometry = await textRenderer.createTextGeometry(testString, options)

  console.log(geometry)

  const camera = new OrthographicCamera(
    window.innerWidth / -2,
    window.innerWidth / 2,
    window.innerHeight / -2,
    window.innerHeight / 2,
    -window.innerWidth / 2,
    window.innerWidth / 2
  )
  camera.position.z = 5

  const scene = new Scene()
  const renderer = new WebGLRenderer()
  document.body.appendChild(renderer.domElement)

  renderer.setSize(window.innerWidth, window.innerHeight)

  const planeGeometry = new PlaneBufferGeometry(300, 100)
  const material = new MeshBasicMaterial({ color: 0xcccccc })
  const plane = new Mesh(planeGeometry, material)
  //scene.add(plane)
  scene.add(camera)

  const mesh = new Mesh(
    geometry,
    new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide })
  )
  scene.add(mesh)

  const loop = () => {
    renderer.render(scene, camera)

    requestAnimationFrame(loop)

    // mesh.rotation.x += 0.01
    // mesh.rotation.y += 0.01
  }

  requestAnimationFrame(loop)
}

main()
