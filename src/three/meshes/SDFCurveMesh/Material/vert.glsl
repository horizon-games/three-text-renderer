precision highp float;

uniform vec4 AHHAx;
uniform vec4 AHHAy;
uniform float windingOrder;
uniform float padding;
attribute vec2 ratioSign;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec3 lineInfoTangentXYDistZ;

void main() {
  float t = ratioSign.x;
  float t2 = min(0.99, max(0.01, t));
  float ti = 1.0 - t;
  float ti2 = 1.0 - t2;


  //a = anchor
  //h = handle
  vec2 a1 = vec2(AHHAx[0], AHHAy[0]);
  vec2 a2 = vec2(AHHAx[3], AHHAy[3]);

  #ifdef USE_BEZIER
    vec2 h1 = vec2(AHHAx[1], AHHAy[1]);
    vec2 h2 = vec2(AHHAx[2], AHHAy[2]);
    //bezier interpolation
    vec2 pos = vec2(
      ti * ti * ti * a1
      + 3.0 * ti * ti * t * h1
      + 3.0 * ti * t * t * h2
      + t * t * t * a2
    );
    vec2 tangent = normalize(vec2(
      3.0 * ti2 * ti2 * (h1 - a1)
      + 6.0 * t2 * ti2 * (h2 - h1)
      + 3.0 * t2 * t2 * (a2 - h2)
    ));
  #elif defined(USE_QUADRATIC)
		vec2 h1 = vec2(AHHAx[1], AHHAy[1]);
		vec2 pos = (ti * ti) * a1
			+ 2.0 * ti * t * h1
			+ t * t * a2;

    vec2 tangent = normalize(vec2(
      ti2 * (h1 - a1)
      + t2 * (a2 - h1)
    ));
  #elif defined(USE_LINEAR)
		vec2 pos = mix(a1, a2, t);
		vec2 tangent = normalize(a2 - a1);
  #endif

  float end = step(0.499, abs(t-0.5));

  float amt = end * 40.0 * sign(t-t2);
  pos += tangent * amt;

  float z = ratioSign.y * padding * 10.0;
  pos -= vec2(-tangent.y, tangent.x) * z;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.x, -abs(z)-abs(amt) * 1.1, pos.y, 1.0);
  lineInfoTangentXYDistZ = vec3(tangent, -ratioSign.y * 10.0) * windingOrder * 0.5 + 0.5;
}