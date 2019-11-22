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
  cpx: number
  cpy: number
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

type Command =
  | MoveCommand
  | LineCommand
  | QuadraticCurveCommand
  | BezierCurveCommand
  | CloseCommand

export default class Path {
  commands: Command[] = []

  moveTo(x: number, y: number) {
    this.commands.push({ type: 'M', x, y })
  }

  lineTo(x: number, y: number) {
    this.commands.push({ type: 'L', x, y })
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
    this.commands.push({ type: 'Q', cpx, cpy, x, y })
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
          ctx.quadraticCurveTo(cmd.cpx, cmd.cpy, cmd.x, cmd.y)
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

  getBoundingBox() {
    const box = new BoundingBox()

    let startX = 0
    let startY = 0
    let prevX = 0
    let prevY = 0

    for (const cmd of this.commands) {
      switch (cmd.type) {
        case 'M':
          box.addPoint(cmd.x, cmd.y)
          startX = prevX = cmd.x
          startY = prevY = cmd.y
          break

        case 'L':
          box.addPoint(cmd.x, cmd.y)
          prevX = cmd.x
          prevY = cmd.y
          break

        case 'Q':
          box.addQuad(prevX, prevY, cmd.cpx, cmd.cpy, cmd.x, cmd.y)
          prevX = cmd.x
          prevY = cmd.y
          break

        case 'C':
          box.addBezier(
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

    return box
  }
}
