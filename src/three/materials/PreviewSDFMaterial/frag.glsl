#ifdef GL_OES_standard_derivatives
  #extension GL_OES_standard_derivatives : enable
#endif

precision highp float;

uniform sampler2D sdf;

varying vec2 vUv;

void main() {
  vec4 sample = texture2D(sdf, vUv);
  float unsignedDistance = sample.b;

  float waterline = 1.0 - step(0.02, abs(unsignedDistance - 0.5));
  gl_FragColor = vec4(sample.rgb + vec3(waterline * 0.05), sample.a);
  // gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
  // gl_FragColor = gl_FragColor.bbba;
  // if(gl_FragColor.a > 0.0 && gl_FragColor.a < 1.0) {
  //   gl_FragColor.r = 1.0 - gl_FragColor.r;
  // }
}