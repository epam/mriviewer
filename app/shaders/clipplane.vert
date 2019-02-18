/**
* Vertex shader for render clip plane to FF texture
*/

uniform mat4 MVP;
varying vec3 Pos;
varying vec4 screenpos;
attribute vec3 uvw;

void main() {
  Pos = uvw;
  screenpos = vec4(position, 1.0);
  gl_Position = screenpos;
}
