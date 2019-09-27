precision highp float;

varying vec3 lineInfoTangentXYDistZ;

void main() {
  gl_FragColor = vec4(lineInfoTangentXYDistZ, 1.0);
}
