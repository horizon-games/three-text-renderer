import TextRenderer from '../../src/index'

//import fontPath from '../fonts/Barlow-Bold.ttf'
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

  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)
  textRenderer.addFont('Amiri-Bold', AmiriBold)

  //const testString = 'This != tést!'
  //const testString = 'مرحبا يا عالم'
  //const testString = 'مممممم'
  const testString = 'مرحبا'

  const fontSize = 192

  const paths = await textRenderer.getTextContours(testString, {
    fontFace: 'Scheherazade-Bold',
    fontSize,
    lang: 'ar',
    direction: TextDirection.RTL
  })

  console.log('paths', paths)

  const boundingBoxes = paths.map(path => path.getBoundingBox())
  console.log('bounding box', boundingBoxes)

  const fullPath = paths.reduce<opentype.Path>((acc, path) => {
    acc.extend(path)
    return acc
  }, new opentype.Path())

  const { font } = await textRenderer.fonts.get('Scheherazade-Bold')!.use()

  let harfbuzz = true

  setInterval(() => {
    harfbuzz = !harfbuzz // Flip back and forth

    context.restore()
    context.save()

    context.clearRect(0, 0, canvas.width, canvas.height)

    context.translate(0, fontSize / 2)

    context.fillStyle = 'rgba(240, 240, 240, 1)'

    // Draw bounding boxes
    boundingBoxes.forEach(bb => {
      context.fillRect(bb.x1, bb.y1, bb.x2 - bb.x1, bb.y2 - bb.y1)
    })

    // Draw harfbuzz output or naive opentype output
    harfbuzz
      ? fullPath.draw(context)
      : font.draw(context, testString, 0, 0, fontSize)

    context.strokeStyle = 'rgba(0, 0, 255, 1)'
    // Draw bounding boxes
    boundingBoxes.forEach(bb => {
      context.strokeRect(bb.x1, bb.y1, bb.x2 - bb.x1, bb.y2 - bb.y1)
    })
  }, 1000)
}

main()
