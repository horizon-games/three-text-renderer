import NiceElement, { NiceCategory } from './NiceElement'

let index = 0
export default class NiceMethod extends NiceElement {
  constructor(
    label: string,
    public onSelect: () => void,
    public buttonLabel: string,
    category: NiceCategory,
    orderPriority: number = 0
  ) {
    super(`method ${index++}`, label, category, orderPriority)
  }
}
