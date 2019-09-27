import BaseTestScene from "./BaseTestScene"

import {nextFrameUpdate} from '../../utils/onNextFrame'
import { masterFrameRateTracker } from "../../utils/framerateTracker"

import { simpleTweener } from '../../utils/animation/tweeners'
import { timeUniform } from "../uniforms"

import UpdateManager from '../../utils/UpdateManager'
import {taskTimer} from '../../utils/taskTimer'
import renderer from "../renderer"

export default class BasicTestBed {
  constructor(private test: BaseTestScene) {
    // Start loop
    requestAnimationFrame(this.loop)
    this.init()
  }

  async init() {
		//async stuff
  }

  loop = () => {
    nextFrameUpdate()
    if (!masterFrameRateTracker.updateShouldRender()) {
      requestAnimationFrame(this.loop)
      return
    }
    const dt = masterFrameRateTracker.currentDeltaTime * simpleTweener.speed

    timeUniform.value += dt

    simpleTweener.rafTick()
    UpdateManager.update(dt)
    taskTimer.update(dt)

    this.test.update(dt)

    // Render Arena
    this.test.render(renderer, dt)

    requestAnimationFrame(this.loop)
  }
}
