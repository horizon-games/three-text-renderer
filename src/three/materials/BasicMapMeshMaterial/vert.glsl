precision highp float;

attribute vec2 uv;
attribute vec4 position;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 vUv;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * position;
  vUv = uv;
}