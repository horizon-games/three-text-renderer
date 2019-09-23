# three-text-renderer
Three js realtime msdf text rendering pipeline that utilizes harfbuzz for text shaping.

## Goals:

This project aims to be a universal solution for rendering text in the context of three.js (it should be fairly trivial to expand the technique to other gl frameworks like babylon).

## Pipeline:

1) Unicode symbols, (ie "Hello") plus a font, (ie Roboto.ttf) are sent to..

2) Harfbuzz to generate text shaping/layout data, whose glyphs are 

3) referenced in the font and contours (bezier curves) are extracted then sent to the..

4) MSDF generator which converts bezier curves into multi-signed distance field bitmaps which are then stored in the..

5) Texture Atlas indexed by glyph ids.

6) Bounding boxes for text shaping data is then used to create geometry for the..

7) TextMesh which uses UVs from the TextureAtlas and finally renders the msdf output.
