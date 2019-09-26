import TextRenderer from '../../src/index'

// @ts-ignore
import fontPath from '../fonts/Barlow-Bold.ttf'

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

document.body.append(canvas)

canvas.width = 800
canvas.height = 400

async function main() {
  const textRenderer = new TextRenderer(fontPath)
  console.log(textRenderer)

  await textRenderer.ready

  const { font } = textRenderer

  var path = font.getPath('Hello111, World!', 0, 150, 72)

  // If you just want to draw the text you can also use font.draw(ctx, text, x, y, fontSize).
  path.draw(context)
}

main()
