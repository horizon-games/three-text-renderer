import TextRenderer from '../../src/index'
import RobotoBold from '../fonts/Roboto-Bold.ttf'
import BarlowBold from '../fonts/Barlow-Bold.ttf'
import ScheherazadeBold from '../fonts/Scheherazade-Bold.ttf'

import {
  Scene,
  OrthographicCamera,
  Mesh,
  WebGLRenderer,
  MeshBasicMaterial,
  DoubleSide,
  Vector3,
  PlaneBufferGeometry,
  SphereBufferGeometry
} from 'three'
import TextEditor from '../common/TextEditor'
import Ruler, { RulerDirection } from '../common/Ruler'

const canvas = document.querySelector('canvas#viewport')! as HTMLCanvasElement
const rulerHorizontal = new Ruler(
  'canvas.ruler.ruler-horizontal',
  RulerDirection.Horizontal
)
const rulerVertical = new Ruler(
  'canvas.ruler.ruler-vertical',
  RulerDirection.Vertical
)

const showAtlasPreview = true

const checkboxAnimate = document.querySelector(
  'input#animate'
)! as HTMLInputElement

async function main() {
  const textRenderer = new TextRenderer()

  textRenderer.addFont('Roboto-Bold', RobotoBold)
  textRenderer.addFont('Barlow-Bold', BarlowBold)
  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)

  const textEditor = new TextEditor(textRenderer)
  textEditor.onUpdate(update)

  rulerHorizontal.onClick(offset => {
    textEditor.maxWidth = offset

    update()
  })

  rulerVertical.onClick(offset => {
    textEditor.maxHeight = offset

    update()
  })

  const scene = new Scene()
  const renderer = new WebGLRenderer({ canvas })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0xcccccc)
  const camera = new OrthographicCamera(1, 1, 1, 1)
  camera.position.z = 5
  scene.add(camera)
  if (showAtlasPreview) {
    const prev = textRenderer.getPreviewMeshMSDF()
    prev.add(new Mesh(new SphereBufferGeometry(0.5)))
    prev.scale.multiplyScalar(200)
    prev.position.set(100, 100, 400)
    scene.add(prev)
  }

  function handleResize() {
    const { innerWidth, innerHeight } = window
    const width = innerWidth - 30
    const height = innerHeight - 30

    renderer.setSize(width, height)
    camera.left = width / -2
    camera.right = width / 2
    camera.top = height / -2
    camera.bottom = height / 2
    camera.near = -1000
    camera.far = 1000

    camera.updateProjectionMatrix()

    camera.position.x = width / 2
    camera.position.y = height / 2
  }

  handleResize()

  window.addEventListener('resize', () => {
    handleResize()
    update()
  })

  let mesh: Mesh | undefined

  async function update() {
    if (mesh) {
      scene.remove(mesh)
    }

    const geometry = await textRenderer.createTextGeometry(textEditor.text, {
      fontFace: textEditor.font,
      fontSize: textEditor.fontSize,
      lang: 'en',
      direction: textEditor.textDirection,
      align: textEditor.textAlign,
      lineHeight: textEditor.lineHeight,
      letterSpacing: textEditor.letterSpacing,
      maxWidth: textEditor.maxWidth,
      maxHeight: textEditor.maxHeight
    })

    const { maxWidth, maxHeight } = textEditor

    mesh = new Mesh(
      geometry,
      new MeshBasicMaterial({
        color: 0xff0000,
        side: DoubleSide,
        map: textRenderer.texture
      })
    )

    scene.add(mesh)

    const boundingMesh = new Mesh(
      new PlaneBufferGeometry(maxWidth, maxHeight),
      new MeshBasicMaterial({
        color: 0xffffff,
        side: DoubleSide
      })
    )
    boundingMesh.position.z -= 0.1
    mesh.add(boundingMesh)

    //const { boundingBox } = geometry
    //const box = new Box3Helper(boundingBox, new Color(0x0000ff))
    //const width = Math.abs(boundingBox.min.x - boundingBox.max.x)
    //const height = Math.abs(boundingBox.min.y - boundingBox.max.y)
    //mesh.add(box)

    geometry.translate(-maxWidth / 2, -maxHeight / 2, 0)

    mesh.position.x += maxWidth / 2
    mesh.position.y += maxHeight / 2

    rulerHorizontal.render(maxWidth)
    rulerVertical.render(maxHeight)
  }

  update()

  const rotation = new Vector3()

  let frameCount = 0
  const loop = () => {
    if (mesh) {
      rotation.y = Math.sin(frameCount / 100) / 2
      rotation.x = Math.sin(frameCount / 400) / 2

      if (checkboxAnimate.checked) {
        mesh.rotation.setFromVector3(rotation)
      } else {
        frameCount = 0
        mesh.rotation.set(0, 0, 0)
      }
    }

    textRenderer.render(renderer)

    renderer.render(scene, camera)

    frameCount++
    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
}

main()
