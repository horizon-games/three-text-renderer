# three-text-renderer

Three js realtime msdf text rendering pipeline that utilizes harfbuzz for text shaping.

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
- Ebrahim Byagowi
