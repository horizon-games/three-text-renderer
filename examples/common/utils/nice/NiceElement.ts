export type NiceCategory =
  | 'user'
  | 'secret'
  | 'never'

export default class NiceElement {
  static registry: NiceElement[] = []
  constructor(
    public name: string,
    public label: string,
    public category: NiceCategory,
    public orderPriority: number = 0
  ) {
    NiceElement.registry.push(this)
    if (orderPriority === 0) {
      orderPriority = NiceElement.registry.length
    }
  }
}
