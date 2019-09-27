import { clamp } from '../../src/utils/math'
import { getUrlFlag } from './utils/location'
import NiceFloatParameter from './utils/nice/NiceFloatParameter'

export const RESET_USER_SETTINGS_TO_DEFAULTS = getUrlFlag('resetSettings')

export const defaultTargetFps = new NiceFloatParameter(
  'target-fps-v2',
  'Target FPS',
  60,
  1,
  60,
  v => clamp(v * 1.2 - 0.1, 0, 1),
  v => Math.round(v).toString(),
  'user',
  RESET_USER_SETTINGS_TO_DEFAULTS,
  1
)
