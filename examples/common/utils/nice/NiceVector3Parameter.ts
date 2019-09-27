import { Vector3 } from 'three'

import { removeFromArray } from './arrayUtils'
import { XYZ } from './colors'
import NiceElement, { NiceCategory } from './NiceElement'
import NiceFloatParameter from './NiceFloatParameter'

export default class NiceVector3Parameter extends NiceElement {
  get valueString() {
    return `x:${this.value.x.toFixed(3)} y:${this.value.y.toFixed(
      3
    )} z:${this.value.z.toFixed(3)}`
  }
  value: Vector3
  x: NiceFloatParameter
  y: NiceFloatParameter
  z: NiceFloatParameter
  protected _listeners: Array<(value: Vector3) => void> = []
  constructor(
    name: string,
    label: string,
    defaultValue: Vector3,
    minValue: number,
    maxValue: number,
    distribution: (value: number) => number,
    valueTextConverter: (value: number) => string,
    category: NiceCategory,
    forceDefault: boolean = false,
    step: number = 0.01,
    sliderOrderPriority: number = 0,
    persistViaLocalStorage: boolean = true
  ) {
    super(name, label, category, sliderOrderPriority)
    this.value = defaultValue.clone()
    const makeFloatParameter = (axis: XYZ) => {
      return new NiceFloatParameter(
        `${name}(%{axis})`,
        '',
        defaultValue.x,
        minValue,
        maxValue,
        distribution,
        valueTextConverter,
        'never',
        forceDefault,
        step,
        sliderOrderPriority,
        persistViaLocalStorage
      )
    }
    this.x = makeFloatParameter('x')
    this.y = makeFloatParameter('y')
    this.z = makeFloatParameter('z')
    const triggerCallbacks = () => {
      for (const l of this._listeners) {
        l(this.value)
      }
    }
    this.x.listen(v => {
      this.value.x = v
      triggerCallbacks()
    })
    this.y.listen(v => {
      this.value.y = v
      triggerCallbacks()
    })
    this.z.listen(v => {
      this.value.z = v
      triggerCallbacks()
    })
  }

  listen(callback: (value: Vector3) => void) {
    this._listeners.push(callback)
    callback(this.value)
  }

  stopListening(callback: (value: Vector3) => void) {
    removeFromArray(this._listeners, callback)
  }
}
