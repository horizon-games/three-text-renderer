import { Path, BoundingBox } from 'opentype.js'

export default class TextPreviewCanvas2D {
	context: CanvasRenderingContext2D;
	constructor(private canvas:HTMLCanvasElement) {
		this.context = canvas.getContext('2d')!
	}
	draw(lines: Path[][], maxWidth:number, maxHeight:number, lineHeight:number) {

    const context = this.context
    const canvas = this.canvas

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
      const mergedPath = paths.reduce<Path>((acc, path) => {
        acc.extend(path)
        return acc
      }, new Path())

      this.renderLine(mergedPath, boundingBoxes, lineHeight)
    })
	}

  renderLine(
    path: Path,
    boundingBoxes: BoundingBox[],
    lineHeight: number
  ) {
    const context = this.context
    context.translate(0, lineHeight)

    path.draw(context)

    context.strokeStyle = 'rgba(0, 0, 255, 1)'
    // Draw bounding boxes
    boundingBoxes.forEach(bb => {
      context.strokeRect(bb.x1, bb.y1, bb.x2 - bb.x1, bb.y2 - bb.y1)
    })
	}
	
	resize(width:number, height:number, pixelRatio:number) {
		const canvas = this.canvas
    canvas.width = width * pixelRatio
    canvas.height = height * pixelRatio

    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

	}

}