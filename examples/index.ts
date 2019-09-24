//import fn from "../src/index";
import * as opentype from 'opentype.js'
import font from './fonts/Barlow-Bold.ttf'

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

document.body.append(canvas)

canvas.width = 800
canvas.height = 400

opentype.load(font, function(err, font) {
  if (err) {
    alert('Font could not be loaded: ' + err)
  } else {
    // Construct a Path object containing the letter shapes of the given text.
    // The other parameters are x, y and fontSize.
    // Note that y is the position of the baseline.
    var path = font.getPath('Hello, World!', 0, 150, 72)

    // If you just want to draw the text you can also use font.draw(ctx, text, x, y, fontSize).
    path.draw(context)
  }
})
