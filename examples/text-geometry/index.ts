import TextRenderer from '../../src/index'
import BarlowBold from '../fonts/Barlow-Bold.ttf'
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
  Color,
  Vector3
} from 'three'

async function main() {
  const scene = new Scene()
  const renderer = new WebGLRenderer()
  document.body.appendChild(renderer.domElement)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0xffffff)
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

  const textRenderer = new TextRenderer()

  textRenderer.addFont('Barlow-Bold', BarlowBold)
  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)
  const testString = 'Hello, World!\nNext line.'
  //const testString = 'مرحبا'

  const input = document.querySelector('textarea#text')! as HTMLTextAreaElement
  input.addEventListener('keyup', () => update(input.value))
  input.value = testString

  const fontSize = 72
  const options: TextOptions = {
    fontFace: 'Barlow-Bold',
    fontSize,
    lang: 'en',
    direction: TextDirection.LTR
  }

  let mesh: Mesh | undefined

  async function update(text: string) {
    if (mesh) {
      scene.remove(mesh)
    }

    const geometry = await textRenderer.createTextGeometry(text, options)
    console.log(geometry)

    mesh = new Mesh(
      geometry,
      new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide })
    )

    scene.add(mesh)

    const { boundingBox } = geometry
    console.log(boundingBox)

    const box = new Box3Helper(boundingBox, new Color(0x0000ff))
    //mesh.add(box)

    const width = Math.abs(boundingBox.min.x - boundingBox.max.x)
    //const height = Math.abs(boundingBox.min.y - boundingBox.max.y)

    geometry.translate(-width / 2, 0, 0)
  }

  update(testString)

  const rotation = new Vector3()

  const loop = () => {
    if (mesh) {
      rotation.x += 0.01
      rotation.y += 0.01
      rotation.z += 0.01

      //mesh.rotation.setFromVector3(rotation)
    }

    renderer.render(scene, camera)

    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
}

main()
