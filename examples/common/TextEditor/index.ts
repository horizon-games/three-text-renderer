import TextRenderer from '../../../src'
import { TextAlign, TextDirection } from '../../../src/TextOptions'

import template from './template'

type UpdateHandler = () => void

export default class TextEditor {
  updateHandlers: Set<UpdateHandler> = new Set()

  elements: {
    text: HTMLTextAreaElement
    font: HTMLSelectElement
    fontSize: HTMLInputElement
    lineHeight: HTMLInputElement
    textDirection: HTMLSelectElement
    textAlign: HTMLSelectElement
    letterSpacing: HTMLInputElement
    maxWidth: HTMLInputElement
    maxHeight: HTMLInputElement
  }

  defaults: { [key: string]: any } = {
    // text: 'This != tést!',
    // text: 'مرحبا يا عالم',
    // text: 'مممممم',
    // text: 'مرحبا',
    text: 'Hello, World!\nNext line.',
    fontSize: 72,
    lineHeight: 1.2,
    letterSpacing: 0,
    maxWidth: Math.floor(window.innerWidth / 100) * 100,
    maxHeight: 400
  }

  get text() {
    return this.elements.text.value
  }

  set text(value: string) {
    this.elements.text.value = value
  }

  get font() {
    return this.elements.font.value
  }

  set font(value: string) {
    this.elements.font.value = value
  }

  get fontSize() {
    return Number(this.elements.fontSize.value) || 1
  }

  set fontSize(value: number) {
    this.elements.fontSize.value = String(value)
  }

  get lineHeight() {
    return Number(this.elements.lineHeight.value)
  }

  set lineHeight(value: number) {
    this.elements.lineHeight.value = String(value)
  }

  get letterSpacing() {
    return Number(this.elements.letterSpacing.value)
  }

  set letterSpacing(value: number) {
    this.elements.letterSpacing.value = String(value)
  }

  get textDirection() {
    return Number(this.elements.textDirection.value) as TextDirection
  }

  set textDirection(value: TextDirection) {
    this.elements.textDirection.value = String(value)
  }

  get textAlign(): TextAlign {
    return this.elements.textAlign.value as TextAlign
  }

  set textAlign(value: TextAlign) {
    this.elements.textAlign.value = String(value)
  }

  get maxWidth() {
    return Number(this.elements.maxWidth.value)
  }

  set maxWidth(value: number) {
    this.elements.maxWidth.value = String(value)
  }

  get maxHeight() {
    return Number(this.elements.maxHeight.value)
  }

  set maxHeight(value: number) {
    this.elements.maxHeight.value = String(value)
  }

  constructor(textRenderer: TextRenderer, selector: string = '.text-editor') {
    const node = document.querySelector(selector)

    if (!node) {
      throw new Error('TextEditor: Could not find node.')
    }

    node.innerHTML = template

    const elements = {
      text: document.querySelector('textarea#text')! as HTMLTextAreaElement,
      font: document.querySelector('select#font')! as HTMLSelectElement,
      fontSize: document.querySelector('input#font-size')! as HTMLInputElement,
      lineHeight: document.querySelector(
        'input#line-height'
      )! as HTMLInputElement,
      textDirection: document.querySelector(
        'select#text-direction'
      )! as HTMLSelectElement,
      textAlign: document.querySelector(
        'select#text-align'
      )! as HTMLSelectElement,
      letterSpacing: document.querySelector(
        'input#letter-spacing'
      )! as HTMLInputElement,
      maxWidth: document.querySelector('input#max-width')! as HTMLInputElement,
      maxHeight: document.querySelector('input#max-height')! as HTMLInputElement
    }

    this.elements = elements

    for (const [key, font] of textRenderer.fonts) {
      elements.font.options.add(new Option(key, font.key))
    }

    elements.textDirection.options.add(
      new Option('LTR', String(TextDirection.LTR))
    )
    elements.textDirection.options.add(
      new Option('RTL', String(TextDirection.RTL))
    )
    elements.textDirection.options.add(
      new Option('TTB', String(TextDirection.TTB))
    )

    elements.textAlign.options.add(new Option('Left', String(TextAlign.Left)))
    elements.textAlign.options.add(new Option('Right', String(TextAlign.Right)))
    elements.textAlign.options.add(
      new Option('Center', String(TextAlign.Center))
    )

    const inputKeys = Object.keys(elements) as Array<keyof typeof elements>

    inputKeys.forEach(key => {
      elements[key].addEventListener('change', this._handleUpdate)

      if (key in this.defaults) {
        elements[key].value = String(this.defaults[key])
      }
    })

    elements.text.addEventListener('keyup', this._handleUpdate)
  }

  onUpdate(callback: UpdateHandler) {
    this.updateHandlers.add(callback)

    return () => {
      this.updateHandlers.delete(callback)
    }
  }

  private _handleUpdate = () => {
    this.updateHandlers.forEach(callback => callback())
  }
}
