export default class Toggle {
  el: HTMLInputElement
  changeListeners: Set<(value: boolean) => void> = new Set()

  constructor(selector: string, defaultValue: boolean = true) {
    this.el = document.querySelector(selector)! as HTMLInputElement

    if (!this.el) {
      throw new Error(`Toggle: Could not find node: ${selector}`)
    }

    this.active = defaultValue

    this.el.addEventListener('click', () =>
      this.changeListeners.forEach(callback => {
        callback(this.active)
      })
    )
  }

  get active(): boolean {
    return !!this.el.checked
  }

  set active(value: boolean) {
    this.el.checked = value
  }

  onChange(callback: (value: boolean) => void) {
    this.changeListeners.add(callback)

    return () => this.changeListeners.delete(callback)
  }
}
