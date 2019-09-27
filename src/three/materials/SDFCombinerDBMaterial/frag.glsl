precision lowp float;
uniform sampler2D backBufferTexture;
uniform sampler2D newTexture;
varying vec2 vUv;

#define PI 3.14159265359

void main() {
	vec4 texelA = texture2D(backBufferTexture, vUv);
	vec4 texelB = texture2D(newTexture, vUv);
	if(texelB.a == 0.0) {
		gl_FragColor = texelA;
	} else if(texelA.a == 0.0) {
		gl_FragColor = texelB;
	} else {
		float distA = texelA.b - 0.5;
		float absDistA = abs(distA);
		float signDistA = sign(distA);
		float distB = texelB.b - 0.5;
		float absDistB = abs(distB);
		float signDistB = sign(distB);
		vec2 tanA = texelA.xy * 2.0 - 1.0;
		vec2 tanB = texelB.xy * 2.0 - 1.0;
		// tanA = normalize(tanA);
		// tanB = normalize(tanB);
		
		vec2 normB = tanB.yx;
		normB.x *= -1.0;

		float mixer = step(absDistA, absDistB);
		if(absDistA == absDistB) {
			mixer = step(distB, distA);
		}
		float angle = atan(tanA.y/tanA.x) - atan(tanB.y/tanB.x);
		if(angle <= -PI) {
			angle += PI + PI;
		} else if(angle > PI) {
			angle -= PI + PI;
		}
		if(signDistA != signDistB && angle < -1.0 && angle > 1.0 && abs(distA - distB) < 0.1) {
			mixer = step(distB, distA);
		}
		gl_FragColor = vec4(mix(texelB.rgb, texelA.rgb, mixer), 1.0);
	}
}
