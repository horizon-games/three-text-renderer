"use strict";
exports.__esModule = true;
var opentype = require("opentype.js");
var TextRenderer = /** @class */ (function () {
    function TextRenderer(options) {
        if (options === void 0) { options = {}; }
        this.options = {
            test: true
        };
        Object.assign(this.options, options);
        console.log(opentype);
    }
    TextRenderer.prototype.test = function () {
        return 'hey';
    };
    return TextRenderer;
}());
exports["default"] = TextRenderer;
