import TextRenderer from '../../src/index'
import TextPreviewCanvas2D from './TextPreviewCanvas2D'
import BarlowBold from '../fonts/Barlow-Bold.ttf'
//import fontPath from '../fonts/FiraCode-Bold.otf'
//import fontPath from '../fonts/ArefRuqaa-Bold.ttf'
//import fontPath from '../fonts/Markazi.ttf'
import ScheherazadeBold from '../fonts/Scheherazade-Bold.ttf'
import AmiriBold from '../fonts/Amiri-Bold.ttf'

import { Path } from 'opentype.js'
import { TextDirection, TextAlign } from '../../src/TextOptions'

import Ruler, { RulerDirection } from './Ruler'
import TextEditor from '../common/TextEditor'

const canvas = document.querySelector('canvas#viewport') as HTMLCanvasElement
const textPrevCanvas = new TextPreviewCanvas2D(canvas)
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

  let lines: Path[][] = []
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
    textPrevCanvas.resize(width, height, pixelRatio)

    render()
  }

  window.addEventListener('resize', handleResize)

  handleResize()

  function render() {
    const { maxWidth, maxHeight } = textEditor

    rulerHorizontal.render(maxWidth)
    rulerVertical.render(maxHeight)
    textPrevCanvas.draw(lines, maxWidth, maxHeight, lineHeight)
  }

  update()
}

main()
