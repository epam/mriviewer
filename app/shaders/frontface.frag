/**
* Pixel shader for render front face of BBOX
*/
precision mediump float;
precision mediump int; 
varying vec3 Pos;
uniform sampler2D texBF;
uniform vec4 PlaneX;
uniform vec4 PlaneY;
uniform vec4 PlaneZ;
varying vec4 screenpos;

//Returns distance along the ray towards the plane
vec4 isectRay(vec3 ray, vec3 start, float max_dist)
{
    float dist = -(dot(PlaneZ.xyz, start) + PlaneZ.w) / dot(ray, PlaneZ.xyz);
    return vec4(ray * dist + start, 0.9);
}

void main() {
  vec2 tc = screenpos.xy / screenpos.w * 0.5 + 0.5;
  vec3 back = texture2D(texBF, tc, 0.0).xyz;
  vec4 vOut = vec4(Pos, 1.0);
  //If the ray intersects the clipping plane, then calculate the intersection point
  if (dot(Pos, PlaneZ.xyz) + PlaneZ.w < 0.0)
    vOut = isectRay(normalize(back - Pos), Pos, length(back - Pos));
  if (dot(back - Pos, back - vOut.xyz) < 0.0)
    vOut = vec4(back, 0.0);
  gl_FragColor = vOut;
}
