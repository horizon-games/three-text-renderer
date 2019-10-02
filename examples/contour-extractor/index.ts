import TextRenderer from '../../src/index'

import BarlowBold from '../fonts/Barlow-Bold.ttf'
//import fontPath from '../fonts/FiraCode-Bold.otf'
//import fontPath from '../fonts/ArefRuqaa-Bold.ttf'
//import fontPath from '../fonts/Markazi.ttf'
import ScheherazadeBold from '../fonts/Scheherazade-Bold.ttf'
import AmiriBold from '../fonts/Amiri-Bold.ttf'

import * as opentype from 'opentype.js'
import { TextDirection } from '../../src/TextOptions'

//const initialText = 'This != tést!'
//const initialText = 'مرحبا يا عالم'
//const initialText = 'مممممم'
//const initialText = 'مرحبا'
const initialText = 'Hello, World!\nNext line.'

const canvas = document.querySelector('canvas') as HTMLCanvasElement
const context = canvas.getContext('2d')!

canvas.width = window.innerWidth - 48
canvas.height = window.innerHeight

// canvas.style.width = `${canvas.width / window.devicePixelRatio}px`
// canvas.style.height = `${canvas.height / window.devicePixelRatio}px`

async function main() {
  const textRenderer = new TextRenderer()

  // Add fonts
  textRenderer.addFont('Barlow-Bold', BarlowBold)
  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)
  textRenderer.addFont('Amiri-Bold', AmiriBold)

  const input = {
    text: document.querySelector('textarea#text')! as HTMLTextAreaElement,
    font: document.querySelector('select#font')! as HTMLSelectElement,
    fontSize: document.querySelector('input#font-size')! as HTMLInputElement,
    lineHeight: document.querySelector(
      'input#line-height'
    )! as HTMLInputElement,
    textDirection: document.querySelector(
      'select#text-direction'
    )! as HTMLSelectElement,
    maxWidth: document.querySelector('input#max-width')! as HTMLInputElement,
    maxHeight: document.querySelector('input#max-height')! as HTMLInputElement
  }

  input.text.value = initialText

  for (const [key, font] of textRenderer.fonts) {
    input.font.options.add(new Option(key, font.key))
  }

  input.fontSize.value = String(72)
  input.lineHeight.value = String(1.2)

  input.textDirection.options.add(new Option('LTR', String(TextDirection.LTR)))
  input.textDirection.options.add(new Option('RTL', String(TextDirection.RTL)))
  input.textDirection.options.add(new Option('TTB', String(TextDirection.TTB)))

  input.maxWidth.value = String(640)
  input.maxHeight.value = String(640)

  const inputKeys = Object.keys(input) as Array<keyof typeof input>
  inputKeys.forEach(key => {
    input[key].addEventListener('change', update)
  })
  input.text.addEventListener('keyup', update)

  async function update() {
    const { font } = await textRenderer.fonts.get(input.font.value)!.use()
    const { ascender, unitsPerEm } = font
    const fontSize = Number(input.fontSize.value) || 1
    const fontScale = (1 / unitsPerEm) * fontSize
    const lineHeight =
      (Number(input.lineHeight.value) || 1) * fontScale * ascender
    const maxWidth = Number(input.maxWidth.value)
    const maxHeight = Number(input.maxHeight.value)
    const lines = await textRenderer.getTextContours(input.text.value, {
      fontFace: input.font.value,
      fontSize: Number(input.fontSize.value),
      lang: 'en',
      direction: (TextDirection[
        input.textDirection.value as any
      ] as any) as number
    })

    context.restore()
    context.save()

    context.clearRect(0, 0, canvas.width, canvas.height)

    // Draw lines
    context.strokeStyle = 'rgba(240, 0, 0, 0.5)'

    for (let i = lineHeight; i < canvas.height; i += lineHeight) {
      context.beginPath()
      context.moveTo(0, i)
      context.lineTo(canvas.width, i)
      context.stroke()
      context.closePath()
    }

    // Draw container
    context.strokeStyle = 'rgba(0, 255, 0, 1)'
    context.strokeRect(0, 0, maxWidth, maxHeight)

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

    context.fillStyle = 'rgba(240, 240, 240, 1)'

    // Draw bounding boxes
    boundingBoxes.forEach(bb => {
      context.fillRect(bb.x1, bb.y1, bb.x2 - bb.x1, bb.y2 - bb.y1)
    })

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
