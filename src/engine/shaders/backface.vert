/**
* Vertex shader for render back face of BBOX
*/
precision highp float;


varying vec3 Pos;
attribute vec3 uvw;
void main() {
  Pos = uvw;
  gl_Position =  (projectionMatrix  * modelViewMatrix * vec4(position, 1.0));
}
