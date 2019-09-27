import { Color } from 'three'

import { hexColor } from '../../../src/three/utils/colors'
import { clamp } from '../../../src/utils/math'

export function getLocalStorageParam(key: string) {
  return localStorage.getItem(key)
}

export function setLocalStorageParam(key: string, val: string) {
  return localStorage.setItem(key, val)
}

export function getLocalStorageFlag(key: string) {
  const result = getLocalStorageParam(key)
  return !!(result === '' || (result && result !== 'false'))
}

export function setLocalStorageFlag(key: string, val: boolean) {
  setLocalStorageParam(key, val ? 'true' : 'false')
}

function __getLocalStorageNumber(
  key: string,
  defaultVal: number,
  parser: (val: string) => number,
  min = -Infinity,
  max = Infinity
) {
  return clamp(
    parser(getLocalStorageParam(key) || defaultVal.toString()),
    min,
    max
  )
}

function __setLocalStorageNumber(key: string, val: number) {
  return setLocalStorageParam(key, val.toString())
}

export function getLocalStorageFloat(
  key: string,
  defaultVal: number,
  min = -Infinity,
  max = Infinity
) {
  return __getLocalStorageNumber(key, defaultVal, parseFloat, min, max)
}
export function setLocalStorageFloat(key: string, val: number) {
  return __setLocalStorageNumber(key, val)
}

function parseBoolean(val: string) {
  switch (val) {
    case 'true':
      return true
    case 'false':
      return false
    default:
      return undefined
  }
}

export function getLocalStorageBoolean(key: string, defaultVal: boolean) {
  const val = parseBoolean(getLocalStorageParam(key) || 'unknown')
  return val !== undefined ? val : defaultVal
}
export function setLocalStorageBoolean(key: string, val: boolean) {
  return setLocalStorageParam(key, val ? 'true' : 'false')
}

export function getLocalStorageInt(
  key: string,
  defaultVal: number,
  min = -Infinity,
  max = Infinity
) {
  return __getLocalStorageNumber(key, defaultVal, parseInt, min, max)
}
export function setLocalStorageInt(key: string, val: number) {
  return __setLocalStorageNumber(key, val)
}

export function getLocalStorageColor(key: string, defaultColor: Color) {
  const str = getLocalStorageParam(key)
  if (str) {
    const chunks = str.split(';').map(s => parseFloat(s))
    if (chunks.length === 3) {
      return new Color(chunks[0], chunks[1], chunks[2])
    }
    return hexColor('#' + str)
  } else {
    return defaultColor
  }
}

export function setLocalStorageColor(key: string, color: Color) {
  setLocalStorageParam(key, `${color.r};${color.g};${color.b}`)
}
