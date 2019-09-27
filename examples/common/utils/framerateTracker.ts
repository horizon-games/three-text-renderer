import { BATTERY_SAVINGS_MODE } from '../device'
import { defaultTargetFps } from '../userSettings'

import { clamp } from '../../../src/utils/math'

class FrameRateTracker {
  currentFps = 30
  targetFps = 60
  averageFps = 30
  currentDeltaTime = 0
  private timeOfLastTest = 0
  private timeOfLastRender = 0
  private fpsSamples: number[] = []
  private totalSamples = 10
  private sampleIndex = 0
  private accumilatedTime = 0
  constructor() {
    for (let i = 0; i < this.totalSamples; i++) {
      this.fpsSamples[i] = 60
    }
  }

  updateShouldRender() {
    const now = performance.now() * 0.001
    const originalDt = now - this.timeOfLastTest
    this.timeOfLastTest = now
    this.accumilatedTime += originalDt

    if (this.targetFps >= 60 || this.accumilatedTime > 0.95 / this.targetFps) {
      this.accumilatedTime = 0

      this.currentDeltaTime = Math.min(now - this.timeOfLastRender, 0.2)
      this.timeOfLastRender = now
      this.currentFps = 1 / this.currentDeltaTime

      this.sampleIndex = (this.sampleIndex + 1) % this.totalSamples
      this.fpsSamples[this.sampleIndex] = this.currentFps
      let averageFps = 0
      for (const sample of this.fpsSamples) {
        averageFps += sample
      }
      averageFps /= this.totalSamples
      this.averageFps = averageFps
      return true
    } else {
      return false
    }
  }

  setFPS(fps: number = defaultTargetFps.value) {
    this.targetFps = clamp(fps, 1, BATTERY_SAVINGS_MODE ? 5 : 60)
  }
}

export const masterFrameRateTracker = new FrameRateTracker()

defaultTargetFps.listen(v => masterFrameRateTracker.setFPS(v))
