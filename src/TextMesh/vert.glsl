attribute vec2 uv;
attribute vec4 position;
attribute vec3 color;
attribute float weight;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
varying vec2 vUv;
varying vec3 vColor;
varying float vWeight;

void main() {
  vUv = uv;
  vColor = color;
  vWeight = weight;

  gl_Position = projectionMatrix * modelViewMatrix * position;
}