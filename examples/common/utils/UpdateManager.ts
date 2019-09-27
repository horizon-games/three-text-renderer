import { removeFromArray } from '../../../src/utils/arrayUtils'

type UpdateCallback = (dt: number) => void

interface Updater {
  update: UpdateCallback
}

const updaters: Updater[] = []
const update = (dt: number) => {
  for (const updater of updaters) {
    updater.update(dt)
  }
}

const register = (sib: Updater) => {
  updaters.push(sib)
}

const unregister = (sib: Updater) => {
  removeFromArray(updaters, sib)
}

const UpdateManager = {
  update,
  register,
  unregister
}

export default UpdateManager
