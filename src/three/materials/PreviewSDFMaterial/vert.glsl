attribute vec2 uv;
attribute vec4 position;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
varying vec2 vUv;

void main() {
  vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * position;
}