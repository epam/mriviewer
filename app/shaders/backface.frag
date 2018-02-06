/**
* Pixel shader for render back face of BBOX
*/
varying vec3 Pos;

//
void main() {
  gl_FragColor = vec4(Pos, 1.0);
}
