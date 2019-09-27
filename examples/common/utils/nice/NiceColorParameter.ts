import { Color } from 'three'

import { niceColorToFloatString } from './colors'
import { getLocalStorageColor, setLocalStorageColor } from './localStorage'
import { NiceCategory } from './NiceElement'
import NiceParameter from './NiceParameter'

export default class NiceColorParameter extends NiceParameter<Color> {
  set value(val: Color) {
    if (this._value === undefined) {
      this._value = new Color()
    } else if (val.equals(this._value)) {
      return
    }
    this._value.copy(val)
    this.attemptPersistence()
    this._listeners.forEach(cb => cb(val))
  }

  get value() {
    return this._value
  }

  constructor(
    name: string,
    label: string,
    defaultValue: Color,
    category: NiceCategory,
    forceDefault: boolean = false,
    sliderOrderPriority: number = 0,
    persistViaLocalStorage: boolean = true
  ) {
    super(
      name,
      label,
      defaultValue.clone(),
      niceColorToFloatString,
      category,
      v => v,
      forceDefault,
      sliderOrderPriority,
      persistViaLocalStorage
    )
  }

  protected attemptPersistence() {
    if (this._persistViaLocalStorage) {
      setLocalStorageColor('skyweaver-settings-' + this.name, this._value)
    }
  }

  protected determineInitialValue() {
    this.value =
      this._persistViaLocalStorage && !this._forceDefault
        ? getLocalStorageColor(
            'skyweaver-settings-' + this.name,
            this._defaultValue
          )
        : this._defaultValue
  }
}
