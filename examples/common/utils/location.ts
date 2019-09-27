import { Color } from 'three'

import { hexColor } from '../../../src/three/utils/colors'
import { clamp } from '../../../src/utils/math'

export function getUrlParam(param: string) {
  return new URL(window.location.href).searchParams.get(param)
}

export function getUrlFlag(param: string) {
  const result = getUrlParam(param)
  return !!(result === '' || (result && result !== 'false'))
}

function __getUrlNumber(
  param: string,
  defaultVal: number,
  parser: (val: string) => number,
  min = -Infinity,
  max = Infinity
) {
  return clamp(parser(getUrlParam(param) || defaultVal.toString()), min, max)
}

export function getUrlFloat(
  param: string,
  defaultVal: number,
  min = -Infinity,
  max = Infinity
) {
  return __getUrlNumber(param, defaultVal, parseFloat, min, max)
}

export function getUrlInt(
  param: string,
  defaultVal: number,
  min = -Infinity,
  max = Infinity
) {
  return __getUrlNumber(param, defaultVal, parseInt, min, max)
}

export function getUrlColor(param: string): Color | null {
  const value = getUrlParam(param)

  return value ? hexColor('#' + value) : null
}

export function queryStringUrlReplacement(
  url: string,
  param: string,
  value: string
) {
  const re = new RegExp('[\\?&]' + param + '=([^&#]*)')
  const match = re.exec(url)
  let delimiter: string
  let newString: string

  if (match === null) {
    // append new param
    const hasQuestionMark = /\?/.test(url)
    delimiter = hasQuestionMark ? '&' : '?'
    newString = url + delimiter + param + '=' + value
  } else {
    delimiter = match[0].charAt(0)
    newString = url.replace(re, delimiter + param + '=' + value)
  }

  return newString
}
