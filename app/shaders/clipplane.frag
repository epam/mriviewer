/**
* Pixel shader for render back face of BBOX
*/

precision highp float;
precision highp int;

uniform sampler2D texBF;
varying vec3 Pos;
varying vec4 screenpos;

//
void main() {
  vec2 tc = screenpos.xy / screenpos.w * 0.5 + 0.5;
  vec4 backTexel = texture2D(texBF, tc, 0.0);
  if (backTexel.a < 0.5)
    gl_FragColor = vec4(Pos, 0.0);
  else
    gl_FragColor = vec4(Pos, 0.5);
}
