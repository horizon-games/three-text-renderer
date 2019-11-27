import BoundingBox from './BoundingBox'

interface MoveCommand {
  type: 'M'
  x: number
  y: number
}

interface LineCommand {
  type: 'L'
  x: number
  y: number
}

interface CloseCommand {
  type: 'Z'
}

interface QuadraticCurveCommand {
  type: 'Q'
  cp1x: number
  cp1y: number
  x: number
  y: number
}

interface BezierCurveCommand {
  type: 'C'
  cp1x: number
  cp1y: number
  cp2x: number
  cp2y: number
  x: number
  y: number
}

export type PathSegment =
  | MoveCommand
  | LineCommand
  | QuadraticCurveCommand
  | BezierCurveCommand
  | CloseCommand

export default class Path {
  commands: PathSegment[] = []
  unitsPerEm: number = 1000
  boundingBox: BoundingBox | undefined

  moveTo(x: number, y: number) {
    this.commands.push({ type: 'M', x, y })
  }

  lineTo(x: number, y: number) {
    this.commands.push({ type: 'L', x, y })
  }

  quadraticCurveTo(cp1x: number, cp1y: number, x: number, y: number) {
    this.commands.push({ type: 'Q', cp1x, cp1y, x, y })
  }

  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ) {
    this.commands.push({ type: 'C', cp1x, cp1y, cp2x, cp2y, x, y })
  }

  close() {
    this.commands.push({ type: 'Z' })
    this.updateBoundingBox()
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()

    this.commands.forEach(cmd => {
      switch (cmd.type) {
        case 'M':
          ctx.moveTo(cmd.x, cmd.y)
          break

        case 'L':
          ctx.lineTo(cmd.x, cmd.y)
          break

        case 'Q':
          ctx.quadraticCurveTo(cmd.cp1x, cmd.cp1y, cmd.x, cmd.y)
          break

        case 'C':
          ctx.bezierCurveTo(
            cmd.cp1x,
            cmd.cp1y,
            cmd.cp2x,
            cmd.cp2y,
            cmd.x,
            cmd.y
          )
          break

        case 'Z':
          ctx.closePath()
          break
      }
    })

    ctx.fill()
  }

  getBoundingBox(): BoundingBox {
    if (!this.boundingBox) {
      this.updateBoundingBox()
    }

    return this.boundingBox!
  }

  updateBoundingBox() {
    if (!this.boundingBox) {
      this.boundingBox = new BoundingBox()
    } else {
      this.boundingBox.reset()
    }

    let startX = 0
    let startY = 0
    let prevX = 0
    let prevY = 0

    for (const cmd of this.commands) {
      switch (cmd.type) {
        case 'M':
          this.boundingBox.addPoint(cmd.x, cmd.y)
          startX = prevX = cmd.x
          startY = prevY = cmd.y
          break

        case 'L':
          this.boundingBox.addPoint(cmd.x, cmd.y)
          prevX = cmd.x
          prevY = cmd.y
          break

        case 'Q':
          this.boundingBox.addQuad(
            prevX,
            prevY,
            cmd.cp1x,
            cmd.cp1y,
            cmd.x,
            cmd.y
          )
          prevX = cmd.x
          prevY = cmd.y
          break

        case 'C':
          this.boundingBox.addBezier(
            prevX,
            prevY,
            cmd.cp1x,
            cmd.cp1y,
            cmd.cp2x,
            cmd.cp2y,
            cmd.x,
            cmd.y
          )
          prevX = cmd.x
          prevY = cmd.y
          break

        case 'Z':
          prevX = startX
          prevY = startY
          break
      }
    }
  }
}
