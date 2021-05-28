/**
* Pixel shader for render back face of BBOX
*/

precision highp float;
precision highp int;

varying float cullvalue;
uniform vec4 color;

//
void main() {
#if backCullMode == 1
  if (cullvalue < 0.0)
    discard;
#else
  if (cullvalue > 0.0)
    discard;
#endif

  gl_FragColor = color;
}
