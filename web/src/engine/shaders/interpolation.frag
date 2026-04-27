/**
* Main pass pixel shader 
*/
//precision highp float;
precision mediump float;
precision mediump int; 

uniform sampler2D texIsoSurface;
uniform vec2 isoSurfTexel;

varying vec4 screenpos;


void main() {
  const float DELTA1 = 0.05;
  const float DELTA2 = 0.05;
  vec4 acc = vec4(0.0, 0.0, 1.0, 1.0);
  // To increase the points of the beginning and end of the ray and its direction
  vec2 tc = screenpos.xy / screenpos.w * 0.5 + 0.5;
  // Read texels adjacent to the pixel
  vec2 tc1 = tc.xy;
  vec2 tSize = isoSurfTexel;
  tc1 = tc1 - 0.5 * tSize;
  vec2 uv_fract = fract(tc1 / tSize);
  vec2 tex_dU = vec2(tSize.x, 0.0);
  vec2 tex_dV = vec2(0.0, tSize.y);
  vec4 iso1 = texture2D(texIsoSurface, tc1, 0.0);
  vec4 iso2 = texture2D(texIsoSurface, tc1 + tex_dU, 0.0);
  vec4 iso3 = texture2D(texIsoSurface, tc1 + tex_dV, 0.0);
  vec4 iso4 = texture2D(texIsoSurface, tc1 + tex_dU + tex_dV, 0.0);

  float delta = DELTA1;
  #if isoRenderFlag==1
  {
    delta = DELTA2;
  }
  #endif
/*
  if (length(iso1.rgb - iso2.rgb) > delta || length(iso1.rgb - iso3.rgb) > delta || length(iso1.rgb - iso4.rgb) > delta)
  {
    // The neighboring texels do not contain an isosurface
    discard;
    return;
  }
*/
  gl_FragColor = vec4(mix(mix(iso1.xyz, iso2.xyz, uv_fract.x), mix(iso3.xyz, iso4.xyz, uv_fract.x), uv_fract.y), 1.0);
  return;

}
