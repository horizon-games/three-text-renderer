import TextRenderer, { Line } from '../../src/index'
import Ruler, { RulerDirection } from '../common/Ruler'
import TextEditor from '../common/TextEditor'
import AmiriBold from '../fonts/Amiri-Bold.ttf'
import BarlowBold from '../fonts/Barlow-Bold.ttf'
import RobotoBold from '../fonts/Roboto-Bold.ttf'
import ScheherazadeBold from '../fonts/Scheherazade-Bold.ttf'

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
  textRenderer.addFont('Roboto-Bold', RobotoBold)
  textRenderer.addFont('Barlow-Bold', BarlowBold)
  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)
  textRenderer.addFont('Amiri-Bold', AmiriBold)

  const textEditor = new TextEditor(textRenderer)
  textEditor.onUpdate(update)

  rulerHorizontal.onClick(offset => {
    textEditor.maxWidth = offset
    update()
  })

  rulerVertical.onClick(offset => {
    textEditor.maxHeight = offset
    update()
  })

  let lines: Line[] = []

  async function update() {
    lines = await textRenderer.getTextContours(
      textEditor.text,
      {
        fontFace: textEditor.font,
        fontSize: textEditor.fontSize,
        lang: 'en',
        direction: textEditor.textDirection,
        align: textEditor.textAlign,
        lineHeight: textEditor.lineHeight,
        letterSpacing: textEditor.letterSpacing,
        maxWidth: textEditor.maxWidth,
        maxHeight: textEditor.maxHeight,
        yDir: 1
      },
      true
    )

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

    context.fillStyle = '#000'
    context.strokeStyle = 'rgba(0, 0, 255, 1)'

    lines.forEach(line => {
      line.glyphs.forEach(glyph => {
        glyph.path!.draw(context)
      })

      // Draw bounding boxes
      const boundingBoxes = line.glyphs.map(({ path }) =>
        path!.getBoundingBox()
      )
      boundingBoxes.forEach(bb => {
        context.strokeRect(bb.x1, bb.y1, bb.x2 - bb.x1, bb.y2 - bb.y1)
      })
    })
  }

  update()
}

main()
