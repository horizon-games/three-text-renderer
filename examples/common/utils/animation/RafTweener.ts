import { RawTweener } from './RawTweener'

export class RafTweener extends RawTweener {
  speed = 1
  rafTick: () => void
  private requestStop = false
  private paused = false
  private ticking = false
  private timeSnapshot = 0
  private update: (delta: number) => void
  constructor(private discreteStepDuration: number = 0, autoStart = true) {
    super()
    this.update = discreteStepDuration > 0 ? this.discreteStepTick : this.tick
    this.rafTick = this._rafTick.bind(this)
    if (autoStart) {
      this.start()
    }
  }
  discreteStepTick(delta: number) {
    delta *= this.speed
    const newNow = this._now + delta
    while (this._now < newNow) {
      this.tick(this.discreteStepDuration)
    }
  }
  start() {
    this.timeSnapshot = performance.now()
    if (this.discreteStepDuration > 0) {
      this.timeSnapshot -= this.timeSnapshot % this.discreteStepDuration
    }
    this._now = this.timeSnapshot
    if (this.ticking) {
      return
    }
    this.ticking = true
    window.requestAnimationFrame(this.rafTick)
  }
  stop() {
    if (!this.ticking || this.requestStop) {
      return
    }
    this.requestStop = true
    this.ticking = false
  }
  pause() {
    this.paused = true
  }
  unpause() {
    this.paused = false
  }
  private _rafTick() {
    if (this.requestStop) {
      this.requestStop = false
      return
    }
    const timeSnapshot = performance.now()
    let delta = (timeSnapshot - this.timeSnapshot) * this.speed
    if (!this.paused) {
      const now = this._now
      this.update(delta)
      delta -= this._now - now
    } else {
      delta = 0
    }
    this.timeSnapshot = timeSnapshot - delta
    if (this.ticking) {
      window.requestAnimationFrame(this.rafTick)
    }
  }
}
