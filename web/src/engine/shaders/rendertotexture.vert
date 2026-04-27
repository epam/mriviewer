/**
* Shader for ???
*/

varying vec4 screenpos;
varying mat4 local2ScreenMatrix;
void main() {
  local2ScreenMatrix = projectionMatrix  * modelViewMatrix;
  screenpos = (local2ScreenMatrix * vec4(position, 1.0));
  gl_Position =  screenpos;
}

