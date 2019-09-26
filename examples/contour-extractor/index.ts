import TextRenderer from '../../src/index'

// @ts-ignore
//import fontPath from '../fonts/Barlow-Bold.ttf'
import fontPath from '../fonts/FiraCode-Bold.otf'
import * as opentype from 'opentype.js'

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

document.body.append(canvas)

canvas.width = 800
canvas.height = 400

async function main() {
  const textRenderer = new TextRenderer(fontPath)
  console.log(textRenderer)

  textRenderer.addFont('Barlow-Bold', fontPath)

  const testString = 'This != tést!'

  const paths = await textRenderer.getTextContours(testString, {
    fontFace: 'Barlow-Bold'
  })

  console.log('paths', paths)

  const fullPath = paths.reduce<opentype.Path>((acc, path) => {
    acc.extend(path)
    return acc
  }, new opentype.Path())

  fullPath.draw(context)
}

main()
