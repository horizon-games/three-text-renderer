import { RESET_USER_SETTINGS_TO_DEFAULTS } from '../userSettings'
import NiceBooleanParameter from '../utils/nice/NiceBooleanParameter'
import NiceFloatParameter from '../utils/nice/NiceFloatParameter'

export const downsamplePixels = new NiceFloatParameter(
  'pixel-down-sample',
  'Graphics Quality',
  3,
  1,
  3,
  v => v,
  v => {
    switch (v) {
      case 1:
        return 'Low'
      case 2:
        return 'Medium'
      case 3:
        return 'High'
      default:
        return 'High'
    }
  },
  'user',
  RESET_USER_SETTINGS_TO_DEFAULTS,
  1
)

export const testOverdraw = new NiceBooleanParameter(
  'test-overdraw',
  'Test Overdraw',
  false,
  'secret',
  v => (v ? 'Yes' : 'No'),
  RESET_USER_SETTINGS_TO_DEFAULTS,
  -99
)
