# three-text-renderer

Three js realtime msdf text rendering pipeline that utilizes harfbuzz for text shaping.

## Problem

Rendering text in WebGL is hard.

- You can take a niave aproach and render bitmap fonts but they dont scale well as you are locked to the bitmap resolution.
- You can convert text to geometry and render but this is very expensive on CPU and GPU.
- You can used a signed distance field but this will require pre processing of your glyphs into an atlas and complicated to maintain multiple fonts.

And these solutions leave it up to you to come up with correct kerning and text shaping which you can do a fairly adequate job at with a niave approach for the latin character set but as soon as you move over to multilingual non-latin character sets you are faced with a monumental task that most would choose to ignore.

### Enter Harfbuzz http://harfbuzz.org

"HarfBuzz is a text shaping engine. It primarily supports OpenType, but also Apple Advanced Typography. HarfBuzz is used in Android, Chrome, ChromeOS, Firefox, GNOME, GTK+, KDE, LibreOffice, OpenJDK, PlayStation, Qt, XeTeX, and other places."

.. and now available through a WASM binary!

## Goals

This project aims to be a universal solution for rendering text in the context of three.js (it should be fairly trivial to expand the technique to other gl frameworks like babylon).

## Pipeline

1. Unicode symbols, (ie "Hello") plus a font, (ie Roboto.ttf) are sent to..

2. Harfbuzz to generate text shaping/layout data, whose glyphs are

3. referenced in the font and contours (bezier curves) are extracted then sent to the..

4. MSDF generator which converts bezier curves into multi-signed distance field bitmaps which are then stored in the..

5. Texture Atlas indexed by glyph ids.

6. Bounding boxes for text shaping data is then used to create geometry for the..

7. TextMesh which uses UVs from the TextureAtlas and finally renders the msdf output.

## Installing

**This package is a work in progress and no npm module is available at this time.**

## Dev environment

You can start the dev environment with:

`yarn dev`

This will direct you to a page with examples of different phases of the pipe line to check out.

# API

## TextRenderer

```typescript

import TextRenderer from 'three-text-renderer'

const textRenderer = new TextRenderer()

textRenderer.addFont('Roboto-Regular', 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2')
textRenderer.addFont('Roboto-Bold', 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2')

textRenderer.useFont('Roboto-Regular').then({ font }) => {
  ...
})

```

addFont(name: string, url: string)

removeFont(name: string)

getFont(name: string)

async useFont(name: string)

async createTextGeometry(text: string, options: TextOptions)

# Thanks

- Behdad Esfahbod http://harfbuzz.org/
- Ebrahim Byagowi http://harfbuzz.org/
