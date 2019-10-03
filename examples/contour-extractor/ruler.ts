export enum RulerDirection {
  Horizontal,
  Vertical
}

export function drawRuler(
  canvas: HTMLCanvasElement,
  dir: RulerDirection,
  max: number
) {
  const context = canvas.getContext('2d')!
  const { offsetWidth: width, offsetHeight: height } = canvas
  const pixelRatio = window.devicePixelRatio

  canvas.width = width * pixelRatio
  canvas.height = height * pixelRatio

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.fillStyle = '#333'
  context.strokeStyle = '#888'
  context.fillRect(0, 0, width, height)

  const drawLine = (offset: number, length: number) => {
    context.beginPath()

    switch (dir) {
      case RulerDirection.Horizontal:
        context.moveTo(offset, height)
        context.lineTo(offset, height - length)
        break

      case RulerDirection.Vertical:
        context.moveTo(width, offset)
        context.lineTo(width - length, offset)
        break
    }

    context.stroke()
    context.closePath()
  }

  // Draw intervals - 10 and 50px
  for (
    let i = 0, len = dir === RulerDirection.Horizontal ? width : height;
    i < len;
    i += 10
  ) {
    if (i % 50 === 0) {
      drawLine(i, len)
    } else if (i % 10 === 0) {
      drawLine(i, 5)
    }
  }

  // Draw labels
  context.font = '8pt sans-serif'
  context.fillStyle = '#ccc'

  const drawLabel = (offset: number) => {
    switch (dir) {
      case RulerDirection.Horizontal:
        context.fillText(String(offset), offset + 2, height - 7)
        break

      case RulerDirection.Vertical:
        context.fillText(String(offset), 2, offset + 10)
        break
    }
  }

  for (
    let i = 0, len = dir === RulerDirection.Horizontal ? width : height;
    i < len;
    i += 50
  ) {
    drawLabel(i)
  }

  context.fillStyle = '#000'
  context.globalAlpha = 0.5
  switch (dir) {
    case RulerDirection.Horizontal:
      context.fillRect(max, 0, width - max, height)

      break

    case RulerDirection.Vertical:
      context.fillRect(0, max, width, height - max)
      break
  }
}
