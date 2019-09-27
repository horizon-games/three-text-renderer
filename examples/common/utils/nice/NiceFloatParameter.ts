import { findClosestNumberIndex } from '../../../../src/utils/arrayUtils'
import { getLocalStorageFloat, setLocalStorageFloat } from '../localStorage'
import { makeSteppedClampCleaner } from '../../../../src/utils/math'
import { NiceCategory } from './NiceElement'
import NiceParameter from './NiceParameter'

const SAMPLES = 100

export default class NiceFloatParameter extends NiceParameter<number> {
  private _distributionCache: Float32Array = new Float32Array(SAMPLES)
  constructor(
    name: string,
    label: string,
    defaultValue: number,
    private _minValue: number,
    private _maxValue: number,
    private _distribution: (value: number) => number,
    valueTextConverter: (value: number) => string,
    category: NiceCategory,
    forceDefault: boolean = false,
    step: number = 0.01,
    sliderOrderPriority: number = 0,
    persistViaLocalStorage: boolean = true
  ) {
    super(
      name,
      label,
      defaultValue,
      valueTextConverter,
      category,
      makeSteppedClampCleaner(step, _minValue, _maxValue),
      forceDefault,
      sliderOrderPriority,
      persistViaLocalStorage
    )
    for (let index = 0; index < SAMPLES; index++) {
      this._distributionCache[index] = this._distribution(index / (SAMPLES - 1))
    }
  }

  protected attemptPersistence() {
    if (this._persistViaLocalStorage) {
      setLocalStorageFloat('skyweaver-settings-' + this.name, this._value)
    }
  }

  protected determineInitialValue() {
    this.value =
      this._persistViaLocalStorage && !this._forceDefault
        ? getLocalStorageFloat(
            'skyweaver-settings-' + this.name,
            this._defaultValue
          )
        : this._defaultValue
  }

  get normalizedValue() {
    return (this._value - this._minValue) / (this._maxValue - this._minValue)
  }

  set normalizedValue(value: number) {
    this.value = value * (this._maxValue - this._minValue) + this._minValue
  }

  get distributedNormalizedValue() {
    return (
      findClosestNumberIndex(this._distributionCache, this.normalizedValue) /
      (this._distributionCache.length - 1)
    )
  }

  set distributedNormalizedValue(value: number) {
    //lerp this in the future for better inbetween values
    this.normalizedValue = this._distributionCache[
      Math.round(value * (this._distributionCache.length - 1))
    ]
  }
}
