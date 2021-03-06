#ifdef GL_OES_standard_derivatives
  #extension GL_OES_standard_derivatives : enable
#endif

precision highp float;

uniform sampler2D msdf;
uniform float contrastMultiplier;
uniform vec2 gridSize;

varying vec2 vUv;

#ifdef USE_MSDF
  float median(float r, float g, float b) {
    return max(min(r, g), max(min(g, b), min(b, r)));
  }
#endif

void main() {
  vec3 sample = texture2D(msdf, vUv).rgb;
  #ifdef USE_MSDF
    float unsignedDistance = median(sample.r, sample.g, sample.b);
  #elif defined(USE_SDF)
    float unsignedDistance = sample.b;
  #endif
  // if ( unsignedDistance == 0.0 ) discard;

  float signedDistance = unsignedDistance - 0.5;

  float contrast = contrastMultiplier / (abs(dFdx(vUv.x)) + abs(dFdy(vUv.y)));
	// float distanceOpacity = signedDistance;
  
  float alpha = min(1.0, max(0.0, signedDistance * contrast));
  
  gl_FragColor = vec4(1.0, 0.0, 0.0, alpha);
  // gl_FragColor = vec4(vec3(alpha, alpha, alpha), 1.0);
  // vec2 thresh = step(0.15, fract(vUv*gridSize));
  // gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.5), 0.5 * (1.0 - min(thresh.x, thresh.y)));
  // gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
}