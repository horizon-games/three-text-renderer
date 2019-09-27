export function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

export function wrap(val: number, min: number, max: number) {
  const range = max - min
  return ((((val - min) % range) + range) % range) + min
}

export function pingPong(val: number, min: number, max: number) {
  const range = max - min
  const normalized = (val - min) / range
  const pinged = 1 - Math.abs((normalized % 2) - 1)
  return pinged * range + min
}

export function absFloor(val: number) {
  return Math.floor(Math.abs(val)) * (val < 0 ? -1 : 1)
}

export function fract(val: number, denom: number) {
  const temp = val / denom
  return temp - ~~temp
}

const tiny = 0.00001
export function closeEnough(val: number, val2: number) {
  return Math.abs(val - val2) < tiny
}

export const TWO_PI = 2 * Math.PI

export const RADIANS_TO_DEGREES = 180 / Math.PI

export const DEGREES_TO_RADIANS = Math.PI / 180

export function radiansToDegrees(radians: number) {
  return radians * RADIANS_TO_DEGREES
}

export function degreesToRadians(degrees: number) {
  return degrees * DEGREES_TO_RADIANS
}

export function lerp(a: number, b: number, dt: number) {
  const out = a + dt * (b - a)
  return Math.abs(b - out) > 0.00001 ? out : b
}

export function unlerp(min: number, max: number, value: number) {
  return (value - min) / (max - min)
}

export function unlerpClamped(min: number, max: number, value: number) {
  return clamp(unlerp(min, max, value), 0, 1)
}

export function degreesDifference(A: number, B: number) {
  return ((((A - B) % 360) + 540) % 360) - 180
}

const tau = Math.PI * 2
const tauAndHalf = Math.PI * 3
export function radiansDifference(a: number, b: number) {
  return ((((a - b) % tau) + tauAndHalf) % tau) - Math.PI
}

export function rand(min: number = 0, max: number = 1) {
  return Math.random() * (max - min) + min
}

export function rand2(scale: number = 1, offset: number = 0) {
  return (Math.random() * 2 - 1) * scale + offset
}

export function nextHighestPowerOfTwo(val: number) {
  return Math.pow(Math.ceil(Math.sqrt(val)), 2)
}

export function isPowerOfTwo(x: number): boolean {
  return x > 0 && (x & (x - 1)) === 0
}

export function inferDirection(val: number, tolerance: number = 0.00001) {
  if (val < -tolerance) {
    return -1
  } else if (val > tolerance) {
    return 1
  } else {
    return 0
  }
}

export function sqr(v: number) {
  return v * v
}

export function isInNormalizedSpace(x: number, y: number) {
  return x > 0 && x < 1 && y > 0 && y < 1
}

export function roundTo(value: number, step: number = 1) {
  if (step === 0) {
    return value
  }
  const inv = 1.0 / step
  return Math.round(value * inv) / inv
}

export function makeSteppedClampCleaner(
  step: number,
  minValue: number,
  maxValue: number
) {
  return (val: number) => {
    return clamp(roundTo(val, step), minValue, maxValue)
  }
}

export function getMaxMapMipLevel(width: number, height: number) {
  return Math.log(Math.max(width, height)) * Math.LOG2E
}

export function xyLength(x: number, y: number) {
  return Math.sqrt(x * x + y * y)
}
