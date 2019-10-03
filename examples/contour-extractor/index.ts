import TextRenderer from '../../src/index'

import BarlowBold from '../fonts/Barlow-Bold.ttf'
//import fontPath from '../fonts/FiraCode-Bold.otf'
//import fontPath from '../fonts/ArefRuqaa-Bold.ttf'
//import fontPath from '../fonts/Markazi.ttf'
import ScheherazadeBold from '../fonts/Scheherazade-Bold.ttf'
import AmiriBold from '../fonts/Amiri-Bold.ttf'

import * as opentype from 'opentype.js'
import { TextDirection } from '../../src/TextOptions'

import Ruler, { RulerDirection } from './ruler'

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

const inputDefaults: { [key: string]: string } = {
  // text: 'This != tést!',
  // text: 'مرحبا يا عالم',
  // text: 'مممممم',
  // text: 'مرحبا',
  text: 'Hello, World!\nNext line.',
  fontSize: String(72),
  lineHeight: String(1.2),
  maxWidth: String(Math.floor(window.innerWidth / 100) * 100),
  maxHeight: String(400)
}

async function main() {
  const textRenderer = new TextRenderer()

  // Add fonts
  textRenderer.addFont('Barlow-Bold', BarlowBold)
  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)
  textRenderer.addFont('Amiri-Bold', AmiriBold)

  for (const [key, font] of textRenderer.fonts) {
    input.font.options.add(new Option(key, font.key))
  }

  input.textDirection.options.add(new Option('LTR', String(TextDirection.LTR)))
  input.textDirection.options.add(new Option('RTL', String(TextDirection.RTL)))
  input.textDirection.options.add(new Option('TTB', String(TextDirection.TTB)))

  const inputKeys = Object.keys(input) as Array<keyof typeof input>

  inputKeys.forEach(key => {
    input[key].addEventListener('change', update)

    if (key in inputDefaults) {
      input[key].value = String(inputDefaults[key])
    }
  })

  input.text.addEventListener('keyup', update)

  rulerHorizontal.canvas.addEventListener('click', ev => {
    input.maxWidth.value = String((ev as any).layerX)

    update()
  })

  rulerVertical.canvas.addEventListener('click', ev => {
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
      maxWidth,
      maxHeight
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
