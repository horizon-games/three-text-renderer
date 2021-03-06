import { Vector2, Vector4 } from 'three'

import { removeFromArray } from './utils/arrayUtils'

class Corner extends Vector2 {
  waste: number = Infinity
  constructor(x: number, y: number) {
    super(x, y)
  }
}
export class PackedBin {
  constructor(
    public position: Corner | undefined,
    public angle: number,
    public aaBin: Vector2
  ) {
    //
  }
  getViewportData() {
    return new Vector4(
      Math.ceil(this.position!.x),
      Math.ceil(this.position!.y),
      Math.ceil(this.aaBin.x),
      Math.ceil(this.aaBin.y)
    )
  }
}

export default class BinPacker {
  private _corners: Corner[] = []
  constructor(private _width: number, private _height: number) {
    this._corners.push(new Corner(0, _height))
    this._corners.push(new Corner(0, 0))
    this._corners.push(new Corner(_width, 0))
  }
  add(bin: Vector2, allowRotate = true) {
    const bestCorner = allowRotate
      ? this.getBestRotatable(bin)
      : this.getBest(bin)
    if (!bestCorner.position) {
      throw new Error('No more space in atlas')
    }
    const newCornerPos = bestCorner.position.clone().add(bestCorner.aaBin)
    const cleanup = this._corners.filter(
      c => c.x <= newCornerPos.x && c.y <= newCornerPos.y
    )
    let lowestX = Infinity
    let lowestY = Infinity
    for (const l of cleanup) {
      lowestX = Math.min(lowestX, l.x)
      lowestY = Math.min(lowestY, l.y)
    }
    const newCornerL = new Corner(lowestX, newCornerPos.y)
    const newCornerR = new Corner(newCornerPos.x, lowestY)
    this._corners.splice(
      this._corners.indexOf(bestCorner.position),
      1,
      newCornerL,
      newCornerR
    )
    removeFromArray(cleanup, bestCorner.position)
    for (const old of cleanup) {
      removeFromArray(this._corners, old)
    }
    return bestCorner
  }
  private scoreCorners(bin: Vector2) {
    const newCornerPos = new Vector2()
    let bestCorner: Corner | undefined
    for (let i = 1; i < this._corners.length - 1; i++) {
      const corner = this._corners[i]
      newCornerPos.copy(corner).add(bin)
      if (newCornerPos.x > this._width || newCornerPos.y > this._height) {
        continue
      }
      let iL = i - 1
      let iR = i + 1
      corner.waste = 0
      while (iL > 0 && this._corners[iL].y < newCornerPos.y) {
        const cLL = this._corners[iL]
        const cLR = this._corners[iL + 1]
        const wasteDiff = (cLR.x - cLL.x) * (newCornerPos.y - cLL.y)
        corner.waste += wasteDiff
        iL--
      }
      while (
        iR < this._corners.length - 1 &&
        this._corners[iR].x < newCornerPos.x
      ) {
        const cRL = this._corners[iR - 1]
        const cRR = this._corners[iR]
        const wasteDiff = (cRL.y - cRR.y) * (newCornerPos.x - cRR.x)
        corner.waste += wasteDiff
        iR++
      }
      if (!bestCorner || corner.waste < bestCorner.waste) {
        bestCorner = corner
      }
    }
    return bestCorner
  }
  private getBestRotatable(bin: Vector2) {
    const bestCorner1 = this.scoreCorners(bin)
    const firstWaste = bestCorner1 ? bestCorner1.waste : Infinity
    const bestCorner2 = this.scoreCorners(new Vector2(bin.y, bin.x))
    const secondWaste = bestCorner2 ? bestCorner2.waste : Infinity
    if (firstWaste === Infinity && secondWaste === Infinity) {
      throw new Error('Could not fit bin, even with rotation')
    }
    const bestCorner = firstWaste < secondWaste ? bestCorner1 : bestCorner2

    let angle = 0
    const adjustedBin = bin.clone()
    if (bestCorner === bestCorner2) {
      adjustedBin.set(bin.y, bin.x)
      angle = Math.PI * 0.5
    }
    return new PackedBin(bestCorner, angle, adjustedBin)
  }
  private getBest(bin: Vector2) {
    return new PackedBin(this.scoreCorners(bin), 0, bin)
  }
}
