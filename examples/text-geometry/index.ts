import TextRenderer from '../../src/index'
import RobotoBold from '../fonts/Roboto-Bold.ttf'
import BarlowBold from '../fonts/Barlow-Bold.ttf'
import ScheherazadeBold from '../fonts/Scheherazade-Bold.ttf'
import AmiriBold from '../fonts/Amiri-Bold.ttf'
import FiraCodeBold from '../fonts/FiraCode-Bold.ttf'


import {
  Scene,
  OrthographicCamera,
  Mesh,
  WebGLRenderer,
  MeshBasicMaterial,
  DoubleSide,
  Vector3,
  PlaneBufferGeometry,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial
} from 'three'
import TextEditor from '../common/TextEditor'
import Ruler, { RulerDirection } from '../common/Ruler'
import TestMSDFMaterial from '../../src/three/materials/TestMSDFMaterial'
import { getUrlParam } from '../common/utils/location'
import Toggle from '../common/Toggle'

const canvas = document.querySelector('canvas#viewport')! as HTMLCanvasElement
const rulerHorizontal = new Ruler(
  'canvas.ruler.ruler-horizontal',
  RulerDirection.Horizontal
)
const rulerVertical = new Ruler(
  'canvas.ruler.ruler-vertical',
  RulerDirection.Vertical
)

const toggles = {
  animate: new Toggle('input#animate'),
  boundingBox: new Toggle('input#bounding-box'),
  atlasPreview: new Toggle('input#atlas-preview', false)
}

let sdfMode: 'sdf' | 'msdf' = 'msdf'
if (getUrlParam('sdfMode') === 'msdf') {
  sdfMode = 'msdf'
}

async function main() {
  const textRenderer = new TextRenderer({
    sdfMode
  })

  textRenderer.addFont('Roboto-Bold', RobotoBold)
  textRenderer.addFont('Barlow-Bold', BarlowBold)
  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)
  textRenderer.addFont('Amiri-Bold', AmiriBold)
  textRenderer.addFont('FiraCode-Bold', FiraCodeBold)
  

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
  //if (showAtlasPreview) {
  const preview = textRenderer.getRawPreviewMesh()
  preview.scale.multiplyScalar(200)
  preview.position.set(100, 100, 400)
  scene.add(preview)
  //}

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

  toggles.boundingBox.onChange(() => update())

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
      maxHeight: textEditor.maxHeight,
      yDir: 1
    })

    const { maxWidth, maxHeight } = textEditor

    geometry.translate(-maxWidth / 2, -maxHeight / 2, 0)

    mesh = new Mesh(
      geometry,
      new TestMSDFMaterial(textRenderer.texture, 64, 64, 1, 0.05, sdfMode)
    )

    scene.add(mesh)

    const planeMesh = new Mesh(
      new PlaneBufferGeometry(maxWidth, maxHeight),
      new MeshBasicMaterial({
        color: 0xffffff,
        side: DoubleSide
      })
    )
    planeMesh.position.z -= 0.2
    mesh.add(planeMesh)

    if (toggles.boundingBox.active) {
      const boundingBoxes = new LineSegments(
        new EdgesGeometry(geometry),
        new LineBasicMaterial({ color: 0x0000ff })
      )
      boundingBoxes.position.z -= 0.1
      mesh.add(boundingBoxes)
    }

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

      if (toggles.animate.active) {
        mesh.rotation.setFromVector3(rotation)
      } else {
        frameCount = 0
        mesh.rotation.set(0, 0, 0)
      }
    }

    preview.visible = toggles.atlasPreview.active

    textRenderer.render(renderer)

    renderer.render(scene, camera)

    frameCount++
    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
}

main()
