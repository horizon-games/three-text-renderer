import TextRenderer from '../../src/index'

import BarlowBold from '../fonts/Barlow-Bold.ttf'
//import fontPath from '../fonts/FiraCode-Bold.otf'
//import fontPath from '../fonts/ArefRuqaa-Bold.ttf'
//import fontPath from '../fonts/Markazi.ttf'
import ScheherazadeBold from '../fonts/Scheherazade-Bold.ttf'
import AmiriBold from '../fonts/Amiri-Bold.ttf'

import * as opentype from 'opentype.js'
import { TextDirection } from '../../src/TextOptions'

import { drawRuler, RulerDirection } from './ruler'

//const initialText = 'This != tést!'
//const initialText = 'مرحبا يا عالم'
//const initialText = 'مممممم'
//const initialText = 'مرحبا'
const initialText = 'Hello, World!\nNext line.'

const canvas = document.querySelector('canvas#viewport') as HTMLCanvasElement
const context = canvas.getContext('2d')!

const rulerHorizontalCanvas = document.querySelector(
  'canvas.ruler.ruler-horizontal'
) as HTMLCanvasElement
const rulerVerticalCanvas = document.querySelector(
  'canvas.ruler.ruler-vertical'
) as HTMLCanvasElement

const input = {
  text: document.querySelector('textarea#text')! as HTMLTextAreaElement,
  font: document.querySelector('select#font')! as HTMLSelectElement,
  fontSize: document.querySelector('input#font-size')! as HTMLInputElement,
  lineHeight: document.querySelector('input#line-height')! as HTMLInputElement,
  textDirection: document.querySelector(
    'select#text-direction'
  )! as HTMLSelectElement,
  maxWidth: document.querySelector('input#max-width')! as HTMLInputElement,
  maxHeight: document.querySelector('input#max-height')! as HTMLInputElement
}

async function main() {
  const textRenderer = new TextRenderer()

  // Add fonts
  textRenderer.addFont('Barlow-Bold', BarlowBold)
  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)
  textRenderer.addFont('Amiri-Bold', AmiriBold)

  input.text.value = initialText

  for (const [key, font] of textRenderer.fonts) {
    input.font.options.add(new Option(key, font.key))
  }

  input.fontSize.value = String(72)
  input.lineHeight.value = String(1.2)

  input.textDirection.options.add(new Option('LTR', String(TextDirection.LTR)))
  input.textDirection.options.add(new Option('RTL', String(TextDirection.RTL)))
  input.textDirection.options.add(new Option('TTB', String(TextDirection.TTB)))

  input.maxWidth.value = String(Math.floor(window.innerWidth / 100) * 100)
  input.maxHeight.value = String(400)

  const inputKeys = Object.keys(input) as Array<keyof typeof input>
  inputKeys.forEach(key => {
    input[key].addEventListener('change', update)
  })
  input.text.addEventListener('keyup', update)

  rulerHorizontalCanvas.addEventListener('click', ev => {
    input.maxWidth.value = String((ev as any).layerX)

    update()
  })

  rulerVerticalCanvas.addEventListener('click', ev => {
    input.maxHeight.value = String((ev as any).layerY)

    update()
  })

  let lines: opentype.Path[][] = []
  let fontSize: number
  let fontScale: number
  let lineHeight: number
  let maxWidth: number
  let maxHeight: number

  async function update() {
    const { font } = await textRenderer.fonts.get(input.font.value)!.use()
    const { ascender, unitsPerEm } = font
    fontSize = Number(input.fontSize.value) || 1
    fontScale = (1 / unitsPerEm) * fontSize
    lineHeight = (Number(input.lineHeight.value) || 1) * fontScale * ascender
    maxWidth = Number(input.maxWidth.value)
    maxHeight = Number(input.maxHeight.value)
    lines = await textRenderer.getTextContours(input.text.value, {
      fontFace: input.font.value,
      fontSize: Number(input.fontSize.value),
      lang: 'en',
      direction: Number(input.textDirection.value),
      maxWidth
    })

    render()
  }

  function handleResize() {
    const width = window.innerWidth
    const height = window.innerHeight
    const pixelRatio = window.devicePixelRatio

    canvas.width = width * pixelRatio
    canvas.height = height * pixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

    render()
  }

  window.addEventListener('resize', handleResize)

  handleResize()

  function render() {
    drawRuler(rulerHorizontalCanvas, RulerDirection.Horizontal, maxWidth)
    drawRuler(rulerVerticalCanvas, RulerDirection.Vertical, maxHeight)

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

    lines.forEach(paths => {
      const boundingBoxes = paths.map(path => path.getBoundingBox())
      const mergedPath = paths.reduce<opentype.Path>((acc, path) => {
        acc.extend(path)
        return acc
      }, new opentype.Path())

      renderLine(mergedPath, boundingBoxes, lineHeight)
    })
  }

  function renderLine(
    path: opentype.Path,
    boundingBoxes: opentype.BoundingBox[],
    lineHeight: number
  ) {
    context.translate(0, lineHeight)

    // Draw bounding boxes
    // context.fillStyle = 'rgba(240, 240, 240, 1)'
    // boundingBoxes.forEach(bb => {
    //   context.fillRect(bb.x1, bb.y1, bb.x2 - bb.x1, bb.y2 - bb.y1)
    // })

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
