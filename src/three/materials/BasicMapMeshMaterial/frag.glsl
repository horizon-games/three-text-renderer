precision lowp float;
uniform sampler2D mapTexture;
varying vec2 vUv;

void main() {
  gl_FragColor = texture2D(mapTexture, vUv);
}
