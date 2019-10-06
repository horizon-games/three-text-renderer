precision lowp float;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform sampler2D texture3;
varying vec2 vUv;

void main() {
	vec4 t1 = texture2D(texture1, vUv);
	vec4 t2 = texture2D(texture2, vUv);
	vec4 t3 = texture2D(texture3, vUv);
	// gl_FragColor = vec4(max(s1, min(s2, s3)), min(s1, s2), min(s3, max(s1, s2)), 1.0);
	gl_FragColor = vec4(vec3(t1.b, t2.b, t3.b), 1.0);
	// gl_FragColor = vec4(min12, min23, min31, 1.0);
	// gl_FragColor = vec4(min(min12, min23), max(min12, min23), min(min31, max(min12, min23)), 1.0);
	// gl_FragColor = vec4(med123, med231, med312, 1.0);
	// gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
