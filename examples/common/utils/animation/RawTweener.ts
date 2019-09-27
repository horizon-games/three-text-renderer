import { copyDefaults } from '../../../../src/utils/jsUtils'
import { lerp } from '../../../../src/utils/math'

import { Easing } from './Easing'

export type NumberEaser = (v: number) => number

interface Params<T> extends Optional {
  target: T
  propertyGoals: Partial<
    { [K in keyof T]: T[K] extends number ? number : never }
  >
}

interface Optional {
  delay?: number
  duration?: number
  easing?: NumberEaser
  onUpdate?: () => void
  onComplete?: () => void
}

const __defaultOptions: Optional = {
  delay: 0,
  duration: 1000,
  easing: Easing.Linear
}

class AnimatedProperty {
  constructor(
    public key: string,
    public valueStart: number,
    public valueEnd: number
  ) {
    //nothing
  }
}

class AnimatedObject {
  readonly duration: number
  onComplete: () => void
  finished: Promise<void>
  constructor(
    private tweener: RawTweener,
    readonly target: any,
    readonly easing: NumberEaser,
    readonly startTime: number,
    readonly endTime: number,
    readonly animatedProperties: AnimatedProperty[],
    readonly onUpdate?: () => void,
    onComplete?: () => void
  ) {
    this.duration = endTime - startTime
    this.finished = new Promise(resolve => {
      this.onComplete = () => {
        if (onComplete) {
          onComplete()
        }
        resolve()
      }
    })
  }
  kill() {
    this.tweener.kill(this)
  }
}

export class RawTweener {
  protected _now = 0
  private _processingTick = false
  private _animations: AnimatedObject[] = []
  private _animationsToComplete: AnimatedObject[] = []
  to<T>(params: Params<T>) {
    this.killTweensOf(params.target)
    copyDefaults(params, __defaultOptions)
    if (typeof params.easing !== 'function') {
      throw new Error(
        'ease must be an easing function that takes in a number (0..1) and returns a number (0..1)'
      )
    }
    const target = params.target
    const goals = params.propertyGoals

    const animatedProperties: AnimatedProperty[] = []
    for (const key in goals) {
      if (goals.hasOwnProperty(key)) {
        const numFrom = (target[key] as unknown) as number
        const numTo = goals[key] as number
        if (!isNaN(numFrom) && !isNaN(numTo)) {
          animatedProperties.push(new AnimatedProperty(key, numFrom, numTo))
        } else {
          throw new Error('values must be numbers')
        }
      }
    }
    const startTime = this._now + params.delay!
    const endTime = startTime + params.duration!
    const animation = new AnimatedObject(
      this,
      target,
      params.easing!,
      startTime,
      endTime,
      animatedProperties,
      params.onUpdate,
      params.onComplete
    )
    this._animations.push(animation)
    return animation
  }
  tick(delta: number) {
    this._now += delta
    const now = this._now
    const animations = this._animations
    this._processingTick = true
    for (const animation of animations) {
      if (now > animation.startTime) {
        const target = animation.target
        const progress = Math.min(
          (now - animation.startTime) / animation.duration,
          1
        )
        // if(isNaN(progress) || progress < 0 || progress > 1) throw new Error('Should not happen.');
        if (progress < 1) {
          const mix = animation.easing(progress)
          for (const ap of animation.animatedProperties) {
            target[ap.key] = lerp(ap.valueStart, ap.valueEnd, mix)
          }
          if (animation.onUpdate) {
            animation.onUpdate()
          }
        } else {
          this._animationsToComplete.push(animation)
        }
      }
    }
    this._processingTick = false
    if (this._animationsToComplete.length > 0) {
      this._animationsToComplete.sort((a, b) => {
        return a.endTime - b.endTime
      })
      for (const animation of this._animationsToComplete) {
        this.kill(animation, -1, true)
      }
      this._animationsToComplete.length = 0
    }
  }
  killTweensOf(target: any) {
    if (this._processingTick) {
      throw new Error('Not allowed during processing of tick')
    }
    const animations = this._animations
    for (let i = animations.length - 1; i >= 0; i--) {
      const animation = animations[i]
      if (animation.target === target) {
        this.kill(animation, i)
      }
    }
  }
  kill(animation: AnimatedObject, index = -1, update = false) {
    if (this._processingTick) {
      throw new Error('Not allowed during processing of tick')
    }
    if (index === -1) {
      index = this._animations.indexOf(animation)
    }
    if (index !== -1) {
      if (update) {
        for (const ap of animation.animatedProperties) {
          animation.target[ap.key] = ap.valueEnd
        }
        if (animation.onUpdate) {
          animation.onUpdate()
        }
      }
      if (animation.onComplete) {
        animation.onComplete()
      }
      this._animations.splice(index, 1)
    }
  }
}
