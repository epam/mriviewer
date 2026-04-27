/**
* Vertex shader for render back face of BBOX
*/
varying float cullvalue;
uniform vec3 geomCenter;
void main() {
  cullvalue = dot(normal, position - geomCenter);
  gl_Position =  (projectionMatrix  * modelViewMatrix * vec4(position, 1.0));
}
