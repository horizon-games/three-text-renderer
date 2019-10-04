import TextRenderer, { Line } from '../../src/index'

import BarlowBold from '../fonts/Barlow-Bold.ttf'
//import fontPath from '../fonts/FiraCode-Bold.otf'
//import fontPath from '../fonts/ArefRuqaa-Bold.ttf'
//import fontPath from '../fonts/Markazi.ttf'
import ScheherazadeBold from '../fonts/Scheherazade-Bold.ttf'
import AmiriBold from '../fonts/Amiri-Bold.ttf'

import { Path, BoundingBox } from 'opentype.js'

import Ruler, { RulerDirection } from './Ruler'
import TextEditor from '../common/TextEditor'

const canvas = document.querySelector('canvas#viewport') as HTMLCanvasElement
const context = canvas.getContext('2d')!
const rulerHorizontal = new Ruler(
  'canvas.ruler.ruler-horizontal',
  RulerDirection.Horizontal
)
const rulerVertical = new Ruler(
  'canvas.ruler.ruler-vertical',
  RulerDirection.Vertical
)

async function main() {
  const textRenderer = new TextRenderer()

  // Add fonts
  textRenderer.addFont('Barlow-Bold', BarlowBold)
  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)
  textRenderer.addFont('Amiri-Bold', AmiriBold)

  const textEditor = new TextEditor(textRenderer)
  textEditor.onUpdate(update)

  rulerHorizontal.canvas.addEventListener('click', ev => {
    textEditor.maxWidth = (ev as any).layerX

    update()
  })

  rulerVertical.canvas.addEventListener('click', ev => {
    textEditor.maxHeight = (ev as any).layerY

    update()
  })

  let lines: Line[] = []
  let fontScale: number
  let lineHeight: number

  async function update() {
    const { font } = await textRenderer.useFont(textEditor.font)
    const { ascender, unitsPerEm } = font

    fontScale = (1 / unitsPerEm) * textEditor.fontSize
    lineHeight = (textEditor.lineHeight || 1) * fontScale * ascender

    lines = await textRenderer.getTextContours(textEditor.text, {
      fontFace: textEditor.font,
      fontSize: textEditor.fontSize,
      lang: 'en',
      direction: textEditor.textDirection,
      align: textEditor.textAlign,
      letterSpacing: textEditor.letterSpacing,
      maxWidth: textEditor.maxWidth,
      maxHeight: textEditor.maxHeight
    })

    render()
  }

  function handleResize() {
    const width = window.innerWidth - 30
    const height = window.innerHeight - 30
    const pixelRatio = window.devicePixelRatio

    canvas.width = width * pixelRatio
    canvas.height = height * pixelRatio

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

    render()
  }

  window.addEventListener('resize', handleResize)

  handleResize()

  function render() {
    const { maxWidth, maxHeight } = textEditor

    rulerHorizontal.render(maxWidth)
    rulerVertical.render(maxHeight)

    context.restore()
    context.save()

    // Clear
    context.fillStyle = '#eee'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Draw container
    context.fillStyle = '#fff'
    context.fillRect(0, 0, maxWidth, maxHeight)

    // Draw lines
    context.strokeStyle = '#eee'

    for (let x = 0; x < maxWidth; x += 50) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, canvas.height)
      context.stroke()
      context.closePath()
    }

    for (let y = 0; y < maxHeight; y += 50) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(canvas.width, y)
      context.stroke()
      context.closePath()
    }

    // XXX Need a different way to do this
    // lines.forEach(line => {
    //   const boundingBoxes = line.glyphs.map(({ path }) => path!.getBoundingBox())
    //   const mergedPath = line.paths.reduce<Path>((acc, path) => {
    //     acc.extend(path)
    //     return acc
    //   }, new Path())

    //   renderLine(mergedPath, boundingBoxes, lineHeight)
    // })
  }

  function renderLine(
    path: Path,
    boundingBoxes: BoundingBox[],
    lineHeight: number
  ) {
    context.translate(0, lineHeight)

    path.draw(context)

    context.strokeStyle = 'rgba(0, 0, 255, 1)'
    // Draw bounding boxes
    boundingBoxes.forEach(bb => {
      context.strokeRect(bb.x1, bb.y1, bb.x2 - bb.x1, bb.y2 - bb.y1)
    })
  }

  update()
}

main()
