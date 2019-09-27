import { simpleTweener } from './animation/tweeners'
import { removeFromArray } from '../../../src/utils/arrayUtils'

export class TimedTask {
  private _task: (() => void) | undefined
  constructor(public expireTime: number, task: () => void) {
    this._task = task
  }
  task() {
    if (this._task) {
      this._task()
      this._task = undefined
    } else {
      console.warn('timed task asked to fire twice??')
    }
  }
}
class Timer {
  time: number
  tasks: TimedTask[]
  constructor() {
    this.time = 0
    this.tasks = []
  }
  update(dt: number) {
    this.time += dt
    while (this.tasks.length > 0 && this.tasks[0].expireTime <= this.time) {
      this.tasks.shift()!.task()
    }
  }
  add(task: () => void, delay: number, compensateTimeWarp: boolean = false) {
    if (compensateTimeWarp) {
      delay *= simpleTweener.speed
    }
    const timedTask = new TimedTask(this.time + delay, task)
    this.tasks.push(timedTask)
    this.tasks.sort((a, b) => a.expireTime - b.expireTime)
    return timedTask
  }
  runPrematurely(timedTask: TimedTask) {
    removeFromArray(this.tasks, timedTask)
    timedTask.task()
  }
  cancel(timedTask: TimedTask) {
    removeFromArray(this.tasks, timedTask)
  }
}
export const taskTimer = new Timer()
