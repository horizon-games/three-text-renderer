import { CubicBezierCurve, LineCurve, Path, ShapePath, Vector2 } from 'three'

import { lerp } from '../../utils/math'
import SDFCurveMesh from '../meshes/SDFCurveMesh'

/**
 * https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
 * https://mortoray.com/2017/02/16/rendering-an-svg-elliptical-arc-as-bezier-curves/ Appendix: Endpoint to center arc conversion
 * From
 * rx ry x-axis-rotation large-arc-flag sweep-flag x y
 * To
 * aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation
 */

function parseArcCommand(
  path: ShapePath,
  rx: number,
  ry: number,
  x_axis_rotation: number,
  large_arc_flag: number,
  sweep_flag: number,
  start: Vector2,
  end: Vector2
) {
  x_axis_rotation = (x_axis_rotation * Math.PI) / 180

  // Ensure radii are positive
  rx = Math.abs(rx)
  ry = Math.abs(ry)

  // Compute (x1′, y1′)
  const dx2 = (start.x - end.x) / 2.0
  const dy2 = (start.y - end.y) / 2.0
  const x1p = Math.cos(x_axis_rotation) * dx2 + Math.sin(x_axis_rotation) * dy2
  const y1p = -Math.sin(x_axis_rotation) * dx2 + Math.cos(x_axis_rotation) * dy2

  // Compute (cx′, cy′)
  let rxs = rx * rx
  let rys = ry * ry
  const x1ps = x1p * x1p
  const y1ps = y1p * y1p

  // Ensure radii are large enough
  const cr = x1ps / rxs + y1ps / rys

  if (cr > 1) {
    // scale up rx,ry equally so cr == 1
    const s = Math.sqrt(cr)
    rx = s * rx
    ry = s * ry
    rxs = rx * rx
    rys = ry * ry
  }

  const dq = rxs * y1ps + rys * x1ps
  const pq = (rxs * rys - dq) / dq
  let q = Math.sqrt(Math.max(0, pq))
  if (large_arc_flag === sweep_flag) {
    q = -q
  }
  const cxp = (q * rx * y1p) / ry
  const cyp = (-q * ry * x1p) / rx

  // Step 3: Compute (cx, cy) from (cx′, cy′)
  const cx =
    Math.cos(x_axis_rotation) * cxp -
    Math.sin(x_axis_rotation) * cyp +
    (start.x + end.x) / 2
  const cy =
    Math.sin(x_axis_rotation) * cxp +
    Math.cos(x_axis_rotation) * cyp +
    (start.y + end.y) / 2

  // Step 4: Compute θ1 and Δθ
  const theta = svgAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  const delta =
    svgAngle(
      (x1p - cxp) / rx,
      (y1p - cyp) / ry,
      (-x1p - cxp) / rx,
      (-y1p - cyp) / ry
    ) %
    (Math.PI * 2)

  path.currentPath.absellipse(
    cx,
    cy,
    rx,
    ry,
    theta,
    theta + delta,
    sweep_flag === 0,
    x_axis_rotation
  )
}

function svgAngle(ux: number, uy: number, vx: number, vy: number) {
  const dot = ux * vx + uy * vy
  const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy)
  let ang = Math.acos(Math.max(-1, Math.min(1, dot / len))) // floating point precision, slightly over values appear
  if (ux * vy - uy * vx < 0) {
    ang = -ang
  }
  return ang
}

function getReflection(a: number, b: number) {
  return a - (b - a)
}

function parseFloats(str: string) {
  const arrayStrings = str.split(/[\s,]+|(?=\s?[+\-])/)
  const arrayNumbers: number[] = []
  for (let i = 0; i < arrayStrings.length; i++) {
    const num = arrayStrings[i]

    // Handle values like 48.6037.7.8
    // TODO Find a regex for this

    if (num.indexOf('.') !== num.lastIndexOf('.')) {
      const split = num.split('.')

      for (let s = 2; s < split.length; s++) {
        arrayStrings.splice(i + s - 1, 0, '0.' + split[s])
      }
    }

    arrayNumbers[i] = parseFloat(num)
  }

  return arrayNumbers
}

export function parseSVGPath(d: string) {
  const path = new ShapePath()

  const point = new Vector2()
  const control = new Vector2()

  const firstPoint = new Vector2()
  let isFirstPoint = true
  let doSetFirstPoint = false

  // console.log( d );

  const commands = d.match(/[a-df-z][^a-df-z]*/gi)
  if (!commands) {
    throw new Error('wtf')
  }

  for (let i = 0, l = commands.length; i < l; i++) {
    const command = commands[i]

    const type = command.charAt(0)
    const data = command.substr(1).trim()

    if (isFirstPoint === true) {
      doSetFirstPoint = true
      isFirstPoint = false
    }

    const numbers = type === 'Z' || type === 'z' ? [0] : parseFloats(data)

    switch (type) {
      case 'M':
        for (let j = 0, jl = numbers.length; j < jl; j += 2) {
          point.x = numbers[j + 0]
          point.y = numbers[j + 1]
          control.x = point.x
          control.y = point.y

          if (j === 0) {
            path.moveTo(point.x, point.y)
          } else {
            path.lineTo(point.x, point.y)
          }

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'H':
        for (let j = 0, jl = numbers.length; j < jl; j++) {
          point.x = numbers[j]
          control.x = point.x
          control.y = point.y
          path.lineTo(point.x, point.y)

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'V':
        for (let j = 0, jl = numbers.length; j < jl; j++) {
          point.y = numbers[j]
          control.x = point.x
          control.y = point.y
          path.lineTo(point.x, point.y)

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'L':
        for (let j = 0, jl = numbers.length; j < jl; j += 2) {
          point.x = numbers[j + 0]
          point.y = numbers[j + 1]
          control.x = point.x
          control.y = point.y
          path.lineTo(point.x, point.y)

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'C':
        for (let j = 0, jl = numbers.length; j < jl; j += 6) {
          path.bezierCurveTo(
            numbers[j + 0],
            numbers[j + 1],
            numbers[j + 2],
            numbers[j + 3],
            numbers[j + 4],
            numbers[j + 5]
          )
          control.x = numbers[j + 2]
          control.y = numbers[j + 3]
          point.x = numbers[j + 4]
          point.y = numbers[j + 5]

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'S':
        for (let j = 0, jl = numbers.length; j < jl; j += 4) {
          path.bezierCurveTo(
            getReflection(point.x, control.x),
            getReflection(point.y, control.y),
            numbers[j + 0],
            numbers[j + 1],
            numbers[j + 2],
            numbers[j + 3]
          )
          control.x = numbers[j + 0]
          control.y = numbers[j + 1]
          point.x = numbers[j + 2]
          point.y = numbers[j + 3]

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'Q':
        for (let j = 0, jl = numbers.length; j < jl; j += 4) {
          path.quadraticCurveTo(
            numbers[j + 0],
            numbers[j + 1],
            numbers[j + 2],
            numbers[j + 3]
          )
          control.x = numbers[j + 0]
          control.y = numbers[j + 1]
          point.x = numbers[j + 2]
          point.y = numbers[j + 3]

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'T':
        for (let j = 0, jl = numbers.length; j < jl; j += 2) {
          const rx = getReflection(point.x, control.x)
          const ry = getReflection(point.y, control.y)
          path.quadraticCurveTo(rx, ry, numbers[j + 0], numbers[j + 1])
          control.x = rx
          control.y = ry
          point.x = numbers[j + 0]
          point.y = numbers[j + 1]

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'A':
        for (let j = 0, jl = numbers.length; j < jl; j += 7) {
          const start = point.clone()
          point.x = numbers[j + 5]
          point.y = numbers[j + 6]
          control.x = point.x
          control.y = point.y
          parseArcCommand(
            path,
            numbers[j],
            numbers[j + 1],
            numbers[j + 2],
            numbers[j + 3],
            numbers[j + 4],
            start,
            point
          )

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'm':
        for (let j = 0, jl = numbers.length; j < jl; j += 2) {
          point.x += numbers[j + 0]
          point.y += numbers[j + 1]
          control.x = point.x
          control.y = point.y

          if (j === 0) {
            path.moveTo(point.x, point.y)
          } else {
            path.lineTo(point.x, point.y)
          }

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'h':
        for (let j = 0, jl = numbers.length; j < jl; j++) {
          point.x += numbers[j]
          control.x = point.x
          control.y = point.y
          path.lineTo(point.x, point.y)

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'v':
        for (let j = 0, jl = numbers.length; j < jl; j++) {
          point.y += numbers[j]
          control.x = point.x
          control.y = point.y
          path.lineTo(point.x, point.y)

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'l':
        for (let j = 0, jl = numbers.length; j < jl; j += 2) {
          point.x += numbers[j + 0]
          point.y += numbers[j + 1]
          control.x = point.x
          control.y = point.y
          path.lineTo(point.x, point.y)

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'c':
        for (let j = 0, jl = numbers.length; j < jl; j += 6) {
          path.bezierCurveTo(
            point.x + numbers[j + 0],
            point.y + numbers[j + 1],
            point.x + numbers[j + 2],
            point.y + numbers[j + 3],
            point.x + numbers[j + 4],
            point.y + numbers[j + 5]
          )
          control.x = point.x + numbers[j + 2]
          control.y = point.y + numbers[j + 3]
          point.x += numbers[j + 4]
          point.y += numbers[j + 5]

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 's':
        for (let j = 0, jl = numbers.length; j < jl; j += 4) {
          path.bezierCurveTo(
            getReflection(point.x, control.x),
            getReflection(point.y, control.y),
            point.x + numbers[j + 0],
            point.y + numbers[j + 1],
            point.x + numbers[j + 2],
            point.y + numbers[j + 3]
          )
          control.x = point.x + numbers[j + 0]
          control.y = point.y + numbers[j + 1]
          point.x += numbers[j + 2]
          point.y += numbers[j + 3]

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'q':
        for (let j = 0, jl = numbers.length; j < jl; j += 4) {
          path.quadraticCurveTo(
            point.x + numbers[j + 0],
            point.y + numbers[j + 1],
            point.x + numbers[j + 2],
            point.y + numbers[j + 3]
          )
          control.x = point.x + numbers[j + 0]
          control.y = point.y + numbers[j + 1]
          point.x += numbers[j + 2]
          point.y += numbers[j + 3]

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 't':
        for (let j = 0, jl = numbers.length; j < jl; j += 2) {
          const rx = getReflection(point.x, control.x)
          const ry = getReflection(point.y, control.y)
          path.quadraticCurveTo(
            rx,
            ry,
            point.x + numbers[j + 0],
            point.y + numbers[j + 1]
          )
          control.x = rx
          control.y = ry
          point.x = point.x + numbers[j + 0]
          point.y = point.y + numbers[j + 1]

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'a':
        for (let j = 0, jl = numbers.length; j < jl; j += 7) {
          const start = point.clone()
          point.x += numbers[j + 5]
          point.y += numbers[j + 6]
          control.x = point.x
          control.y = point.y
          parseArcCommand(
            path,
            numbers[j],
            numbers[j + 1],
            numbers[j + 2],
            numbers[j + 3],
            numbers[j + 4],
            start,
            point
          )

          if (j === 0 && doSetFirstPoint === true) {
            firstPoint.copy(point)
          }
        }
        break

      case 'Z':
      case 'z':
        path.currentPath.autoClose = true

        if (path.currentPath.curves.length > 0) {
          // Reset point to beginning of Path
          point.copy(firstPoint)
          path.currentPath.currentPoint.copy(point)
          isFirstPoint = true
        }
        break

      default:
        console.warn(command)
    }

    // console.log( type, parseFloats( data ), parseFloats( data ).length  )

    doSetFirstPoint = false
  }

  return path
}

export function makeSvgShapeMeshes(
  shape: ShapePath,
  padding: number,
  scale: number,
  offset: Vector2
) {
  const meshes: SDFCurveMesh[] = []
  for (const subPath of shape.subPaths as Path[]) {
    for (const curve of subPath.curves) {
      let curveMesh: SDFCurveMesh | undefined
      if (curve instanceof CubicBezierCurve) {
        curveMesh = new SDFCurveMesh('bezier', 32, 1, padding)
        curveMesh.setAnchor1v(curve.v0)
        curveMesh.setHandle1v(curve.v1)
        curveMesh.setHandle2v(curve.v2)
        curveMesh.setAnchor2v(curve.v3)
      } else if (curve instanceof LineCurve) {
        curveMesh = new SDFCurveMesh('linear', 32, 1, padding)
        curveMesh.setAnchor1v(curve.v1)
        curveMesh.setHandle1(
          lerp(curve.v1.x, curve.v2.x, 1 / 3),
          lerp(curve.v1.y, curve.v2.y, 1 / 3)
        )
        curveMesh.setHandle2(
          lerp(curve.v1.x, curve.v2.x, 2 / 3),
          lerp(curve.v1.y, curve.v2.y, 2 / 3)
        )
        curveMesh.setAnchor2v(curve.v2)
      } else {
        console.warn('unknown curve type')
        // debugger
      }
      if (curveMesh) {
        curveMesh.transform(offset, scale)
        meshes.push(curveMesh)
      } else {
        console.warn('no curve created')
        // debugger
      }
    }
  }
  return meshes
}
