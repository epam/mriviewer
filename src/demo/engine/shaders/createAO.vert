/**
* Vertex shader for filtering source dates
*/
varying vec2 texCoord;
void main() {
  texCoord = position.xy + vec2(0.5, 0.5);
  //gl_Position =  (projectionMatrix  * modelViewMatrix * vec4(position, 1.0));
  gl_Position = vec4(position * 2.0 , 1.0);//vec4(position, 1.0);
}
