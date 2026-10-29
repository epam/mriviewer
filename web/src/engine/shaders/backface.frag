/**
* Pixel shader for render back face of BBOX
*/

precision highp float;
precision highp int;

varying vec3 Pos;

//
void main() {
  gl_FragColor = vec4(Pos, 1.0);
}
