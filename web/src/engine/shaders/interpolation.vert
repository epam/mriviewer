/**
* Main pass vertex shader
*/

varying vec4 screenpos;

void main() {
  screenpos = (projectionMatrix  * modelViewMatrix * vec4(position, 1.0));
  gl_Position =  screenpos;
}
