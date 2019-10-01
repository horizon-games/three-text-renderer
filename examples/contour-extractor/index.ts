import TextRenderer from '../../src/index'

import BarlowBold from '../fonts/Barlow-Bold.ttf'
//import fontPath from '../fonts/FiraCode-Bold.otf'
//import fontPath from '../fonts/ArefRuqaa-Bold.ttf'
//import fontPath from '../fonts/Markazi.ttf'
import ScheherazadeBold from '../fonts/Scheherazade-Bold.ttf'
import AmiriBold from '../fonts/Amiri-Bold.ttf'

import * as opentype from 'opentype.js'
import { TextDirection } from '../../src/TextOptions'

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')!

document.body.append(canvas)

canvas.width = window.innerWidth
canvas.height = window.innerHeight

// canvas.style.width = `${canvas.width / window.devicePixelRatio}px`
// canvas.style.height = `${canvas.height / window.devicePixelRatio}px`

async function main() {
  const textRenderer = new TextRenderer()
  console.log(textRenderer)

  textRenderer.addFont('Barlow-Bold', BarlowBold)
  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)
  textRenderer.addFont('Amiri-Bold', AmiriBold)

  //const testString = 'This != tést!'
  //const testString = 'مرحبا يا عالم'
  //const testString = 'مممممم'
  //const testString = 'مرحبا'
  const testString = 'Hello, World!\n'
  const { font } = await textRenderer.fonts.get('Scheherazade-Bold')!.use()
  const { ascender, descender, unitsPerEm } = font
  const fontSize = 72
  const fontScale = (1 / unitsPerEm) * fontSize
  const lineHeight = fontScale * ascender
  const input = document.querySelector('textarea#text')! as HTMLTextAreaElement

  input.addEventListener('keyup', ev => update(input.value))

  input.value = testString

  async function update(text: string) {
    const lines = await textRenderer.getTextContours(text, {
      fontFace: 'Barlow-Bold',
      fontSize,
      lang: 'en',
      direction: TextDirection.LTR
    })
    console.log('lines', lines)

    context.restore()
    context.save()

    context.clearRect(0, 0, canvas.width, canvas.height)

    lines.forEach(paths => {
      console.log('paths', paths)

      const boundingBoxes = paths.map(path => path.getBoundingBox())
      console.log('bounding box', boundingBoxes)

      const fullPath = paths.reduce<opentype.Path>((acc, path) => {
        acc.extend(path)
        return acc
      }, new opentype.Path())

      renderLine(fullPath, boundingBoxes)
    })
  }

  function renderLine(
    path: opentype.Path,
    boundingBoxes: opentype.BoundingBox[]
  ) {
    // Draw lines
    context.strokeStyle = 'rgba(240, 0, 0, 0.5)'

    for (let i = lineHeight; i < canvas.height; i += lineHeight) {
      context.beginPath() // Start a new path
      context.moveTo(0, i) // Move the pen to (30, 50)
      context.lineTo(canvas.width, i) // Draw a line to (150, 100)
      context.stroke()
      context.closePath()
    }

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

  update(input.value)

  // setInterval(() => {
  //   harfbuzz = !harfbuzz // Flip back and forth
  //   render()
  // }, 1000)
}

main()
