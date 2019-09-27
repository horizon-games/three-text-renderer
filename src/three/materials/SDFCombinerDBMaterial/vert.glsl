precision lowp float;

attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  vUv = uv;
}