import * as opentype from 'opentype.js'

interface TextRendererOptions {
  test: boolean
}

export default class TextRenderer {
  options: TextRendererOptions = {
    test: true
  }

  constructor(options: Partial<TextRendererOptions> = {}) {
    Object.assign(this.options, options)

    console.log(opentype)
  }

  test(): string {
    return 'hey'
  }
}
