import { NiceCategory } from './NiceElement'
import NiceParameter from './NiceParameter'
import { setLocalStorageBoolean, getLocalStorageBoolean } from '../localStorage'

export default class NiceBooleanParameter extends NiceParameter<boolean> {
  constructor(
    name: string,
    label: string,
    defaultValue: boolean,
    category: NiceCategory,
    valueTextConverter = (b: boolean): string => (b ? 'True' : 'False'),
    forceDefault: boolean = false,
    sliderOrderPriority: number = 0,
    persistViaLocalStorage: boolean = true
  ) {
    super(
      name,
      label,
      defaultValue,
      valueTextConverter,
      category,
      undefined,
      forceDefault,
      sliderOrderPriority,
      persistViaLocalStorage
    )
  }

  protected attemptPersistence() {
    if (this._persistViaLocalStorage) {
      setLocalStorageBoolean('skyweaver-settings-' + this.name, this._value)
    }
  }

  protected determineInitialValue() {
    this._value =
      this._persistViaLocalStorage && !this._forceDefault
        ? getLocalStorageBoolean(
            'skyweaver-settings-' + this.name,
            this._defaultValue
          )
        : this._defaultValue
  }
}
