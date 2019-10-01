
import { onNextFrame } from './onNextFrame'
import { taskTimer } from './taskTimer'
import { simpleTweener } from './animation/tweeners'

export async function promiseAllWithProgress(
  iterable: Iterable<Promise<any>>,
  progressCallback: (progress: ProgressEvent) => void
) {
  await Promise.resolve() // don't resolve synchronously ever
  const promises = Array.from(iterable).map(Promise.resolve.bind(Promise))
  const total = promises.length
  let loaded = 0
  const values = promises.map(async promise => {
    const value = await promise
    const event = new ProgressEvent('progress', {
      total,
      loaded: ++loaded
    })

    progressCallback(event)

    return value
  })
  await Promise.all(values)
  // fire once for 100%
  progressCallback(
    new ProgressEvent('progress', {
      total,
      loaded: total
    })
  )
}

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve =>
    setTimeout(() => {
      resolve()
    }, ms)
  )
}

export async function animationDelay(ms: number) {
  return new Promise(resolve =>
    simpleTweener.to({
      target: {},
      propertyGoals: {},
      duration: ms,
      onComplete: resolve
    })
  )
}

export async function preciseDelay(
  ms: number,
  startOnNextFrame: boolean = false
) {
  return new Promise<void>(resolve => {
    const startTimer = () => {
      taskTimer.add(() => {
        resolve()
      }, ms * 0.001)
    }
    if (startOnNextFrame) {
      onNextFrame(startTimer)
    } else {
      startTimer()
    }
  })
}

// An empty Promise that exposes a resolve function
// Useful for creating an awaitable Promise flag that you can
// resolve from the outside
export interface Resolvable<T extends void> extends Promise<T> {
  resolve: () => void
}

export const createResolvable = () => {
  let resolver: any
  const resolvable = new Promise(resolve => {
    resolver = resolve
  })
  ;(resolvable as any).resolve = resolver

  return (resolvable as any) as Resolvable<void>
}
