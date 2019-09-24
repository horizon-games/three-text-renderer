"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//import fn from "../src/index";
var opentype = __importStar(require("opentype.js"));
// @ts-ignore
var Barlow_Bold_ttf_1 = __importDefault(require("../fonts/Barlow-Bold.ttf"));
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
document.body.append(canvas);
canvas.width = 800;
canvas.height = 400;
opentype.load(Barlow_Bold_ttf_1.default, function (err, font) {
    if (err) {
        alert('Font could not be loaded: ' + err);
    }
    else {
        // Construct a Path object containing the letter shapes of the given text.
        // The other parameters are x, y and fontSize.
        // Note that y is the position of the baseline.
        var path = font.getPath('Hello, World!', 0, 150, 72);
        // If you just want to draw the text you can also use font.draw(ctx, text, x, y, fontSize).
        path.draw(context);
    }
});
