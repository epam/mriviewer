/**
* Vertex shader for render front face of BBOX
*/
precision highp float;
precision highp int;

varying vec4 screenpos;
varying vec3 Pos;
attribute vec3 uvw;
void main() {
  screenpos = (projectionMatrix  * modelViewMatrix * vec4(position, 1.0));
  Pos = uvw;
  gl_Position =  screenpos;// (projectionMatrix  * modelViewMatrix * vec4(position, 1.0));
}
