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

  textRenderer.addFont('Barlow-Bold', fontPath)

  const testString = 'This is a test of the emergency broadcast system'

  textRenderer.createTextGeometry(testString, { fontFace: 'Barlow-Bold' })

  const { font } = await textRenderer.fonts.get('Barlow-Bold').use()

  var path = font.getPath(testString, 0, 150, 72)

  path.draw(context)
}

main()
