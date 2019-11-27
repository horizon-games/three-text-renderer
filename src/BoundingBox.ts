import { Box2, Vector2 } from 'three'

export default class BoundingBox {
  x1: number = Infinity
  y1: number = Infinity
  x2: number = -Infinity
  y2: number = -Infinity

  reset() {
    this.x1 = Infinity
    this.y1 = Infinity
    this.x2 = -Infinity
    this.y2 = -Infinity
  }

  getBox2() {
    return new Box2(
      new Vector2(this.x1, this.y1),
      new Vector2(this.x2, this.y2)
    )
  }

  addX(x: number) {
    if (x < this.x1) {
      this.x1 = x
    }
    if (x > this.x2) {
      this.x2 = x
    }
  }

  addY(y: number) {
    if (y < this.y1) {
      this.y1 = y
    }
    if (y > this.y2) {
      this.y2 = y
    }
  }

  addPoint(x: number, y: number) {
    this.addX(x)
    this.addY(y)
  }

  addBezier(
    x0: number,
    y0: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ) {
    // This code is based on http://nishiohirokazu.blogspot.com/2009/06/how-to-calculate-bezier-curves-bounding.html
    // and https://github.com/icons8/svg-path-bounding-box

    const p0 = [x0, y0]
    const p1 = [cp1x, cp1y]
    const p2 = [cp2x, cp2y]
    const p3 = [x, y]

    this.addPoint(x0, y0)
    this.addPoint(x, y)

    for (let i = 0; i <= 1; i++) {
      const b = 6 * p0[i] - 12 * p1[i] + 6 * p2[i]
      const a = -3 * p0[i] + 9 * p1[i] - 9 * p2[i] + 3 * p3[i]
      const c = 3 * p1[i] - 3 * p0[i]

      if (a === 0) {
        if (b === 0) {
          continue
        }
        const t = -c / b
        if (0 < t && t < 1) {
          if (i === 0) {
            this.addX(derive(p0[i], p1[i], p2[i], p3[i], t))
          }
          if (i === 1) {
            this.addY(derive(p0[i], p1[i], p2[i], p3[i], t))
          }
        }
        continue
      }

      const b2ac = Math.pow(b, 2) - 4 * c * a
      if (b2ac < 0) {
        continue
      }
      const t1 = (-b + Math.sqrt(b2ac)) / (2 * a)
      if (0 < t1 && t1 < 1) {
        if (i === 0) {
          this.addX(derive(p0[i], p1[i], p2[i], p3[i], t1))
        }
        if (i === 1) {
          this.addY(derive(p0[i], p1[i], p2[i], p3[i], t1))
        }
      }
      const t2 = (-b - Math.sqrt(b2ac)) / (2 * a)
      if (0 < t2 && t2 < 1) {
        if (i === 0) {
          this.addX(derive(p0[i], p1[i], p2[i], p3[i], t2))
        }
        if (i === 1) {
          this.addY(derive(p0[i], p1[i], p2[i], p3[i], t2))
        }
      }
    }
  }

  addQuad(
    x0: number,
    y0: number,
    cpx: number,
    cpy: number,
    x: number,
    y: number
  ) {
    const cp1x = x0 + (2 / 3) * (cpx - x0)
    const cp1y = y0 + (2 / 3) * (cpy - y0)
    const cp2x = cp1x + (1 / 3) * (x - x0)
    const cp2y = cp1y + (1 / 3) * (y - y0)

    this.addBezier(x0, y0, cp1x, cp1y, cp2x, cp2y, x, y)
  }
}

const derive = (v0: number, v1: number, v2: number, v3: number, t: number) => {
  return (
    Math.pow(1 - t, 3) * v0 +
    3 * Math.pow(1 - t, 2) * t * v1 +
    3 * (1 - t) * Math.pow(t, 2) * v2 +
    Math.pow(t, 3) * v3
  )
}
