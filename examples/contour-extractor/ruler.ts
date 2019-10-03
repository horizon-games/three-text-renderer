export enum RulerDirection {
  Horizontal,
  Vertical
}

export default class Ruler {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  direction: RulerDirection

  width: number = 0
  height: number = 0

  drawInterval: (offset: number, length: number) => void
  drawLabel: (offset: number) => void

  constructor(selector: string, direction: RulerDirection) {
    this.canvas = document.querySelector(selector) as HTMLCanvasElement
    this.direction = direction

    if (!this.canvas) {
      throw new Error(
        `Ruler: Could not find element with selector: ${selector}`
      )
    }

    this.context = this.canvas.getContext('2d')!

    this.drawInterval = (offset: number, length: number) => {
      this.context.beginPath()

      switch (this.direction) {
        case RulerDirection.Horizontal:
          this.context.moveTo(offset, this.height)
          this.context.lineTo(offset, this.height - length)
          break

        case RulerDirection.Vertical:
          this.context.moveTo(this.width, offset)
          this.context.lineTo(this.width - length, offset)
          break
      }

      this.context.stroke()
      this.context.closePath()
    }

    this.drawLabel = (offset: number) => {
      switch (this.direction) {
        case RulerDirection.Horizontal:
          this.context.fillText(String(offset), offset + 2, this.height - 7)
          break

        case RulerDirection.Vertical:
          this.context.fillText(String(offset), 2, offset + 10)
          break
      }
    }

    const handleResize = () => {
      const { offsetWidth: width, offsetHeight: height } = this.canvas
      const pixelRatio = window.devicePixelRatio

      this.width = width
      this.height = height

      this.canvas.width = width * pixelRatio
      this.canvas.height = height * pixelRatio

      this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    window.addEventListener('resize', handleResize)

    handleResize()
  }

  render(maxRange: number) {
    this.context.fillStyle = '#333'
    this.context.strokeStyle = '#888'
    this.context.fillRect(0, 0, this.width, this.height)

    // Draw intervals - 10 and 50px
    for (
      let i = 0,
        len =
          this.direction === RulerDirection.Horizontal
            ? this.width
            : this.height;
      i < len;
      i += 10
    ) {
      if (i % 50 === 0) {
        this.drawInterval(i, len)
      } else if (i % 10 === 0) {
        this.drawInterval(i, 5)
      }
    }

    // Draw labels
    this.context.font = '8pt sans-serif'
    this.context.fillStyle = '#ccc'

    for (
      let i = 0,
        len =
          this.direction === RulerDirection.Horizontal
            ? this.width
            : this.height;
      i < len;
      i += 50
    ) {
      this.drawLabel(i)
    }

    this.context.fillStyle = '#000'
    this.context.globalAlpha = 0.5
    switch (this.direction) {
      case RulerDirection.Horizontal:
        this.context.fillRect(maxRange, 0, this.width - maxRange, this.height)

        break

      case RulerDirection.Vertical:
        this.context.fillRect(0, maxRange, this.width, this.height - maxRange)
        break
    }
  }
}
