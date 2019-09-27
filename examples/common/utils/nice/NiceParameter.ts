import { removeFromArray } from '../../../../src/utils/arrayUtils'
import NiceElement, { NiceCategory } from './NiceElement'
export default class NiceParameter<T> extends NiceElement {
  set value(val: T) {
    if (val === this._value) {
      return
    }
    val = this._valueCleaner(val)
    if (val === this._value) {
      return
    }
    this._value = val
    this.attemptPersistence()
    this._listeners.forEach(cb => cb(val))
  }

  get value() {
    return this._value
  }

  get valueString() {
    return this._valueTextConverter(this._value)
  }

  protected _value: T
  protected _listeners: Array<(value: T) => void> = []
  constructor(
    name: string,
    label: string,
    protected _defaultValue: T,
    private _valueTextConverter: (value: T) => string,
    category: NiceCategory,
    protected _valueCleaner: (val: T) => T = v => v,
    protected _forceDefault: boolean = false,
    orderPriority: number = 0,
    protected _persistViaLocalStorage: boolean = true
  ) {
    super(name, label, category, orderPriority)
    this.determineInitialValue()
  }

  listen(callback: (value: T) => void) {
    this._listeners.push(callback)
    callback(this.value)
  }

  stopListening(callback: (value: T) => void) {
    removeFromArray(this._listeners, callback)
  }

  protected determineInitialValue() {
    throw new Error('Override this')
  }

  protected attemptPersistence() {
    throw new Error('Override this')
  }
}
