/**
* Vertex shader for render clip plane to FF texture
*/

varying vec3 Pos;
attribute vec3 uvw;
void main() {
  Pos = uvw;
  gl_Position =  vec4(position, 1.0);
}
