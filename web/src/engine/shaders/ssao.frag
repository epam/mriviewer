/**
* SSAO technique for isosurface vr
*/
precision mediump float;
precision mediump int;

uniform float xDim;
uniform float yDim;
uniform float texSize;
uniform float tileCountX;
uniform float volumeSizeZ;
uniform sampler2D texFF;
uniform sampler2D texBF;
uniform sampler2D texVolume;
uniform sampler2D texColorFrame;
uniform sampler2D texIsosurfFrame;

/*
type: "v3v", value: [ new THREE.Vector3( 0.1, 0.2, 0.3 ), 
                                       new THREE.Vector3( 0.4, 0.5, 0.6 ) ] }, // Vector3 array
*/
const int nOffsets = 16;
uniform vec3 offsets[nOffsets];

varying vec4 screenpos;
varying mat4 local2ScreenMatrix;

float tex3D(vec3 vecCur) {
  float tCX = 1.0 / tileCountX;
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  // check outside of texture volume
  if ((vecCur.x < 0.0) || (vecCur.y < 0.0) || (vecCur.z < 0.0) || (vecCur.x > 1.0) ||  (vecCur.y > 1.0) || (vecCur.z > 1.0))
    return 0.0;
  float zSliceNumber1 = floor(vecCur.z  * (volumeSizeZ));
    float zRatio = (vecCur.z * (volumeSizeZ)) - zSliceNumber1;
  //zSliceNumber1 = min(zSliceNumber1, volumeSizeZ - 1.0);
  // As we use trilinear we go the next Z slice.
  float zSliceNumber2 = min( zSliceNumber1 + 1.0, (volumeSizeZ - 1.0)); //Clamp to 255
  vec2 texCoord = vecCur.xy;
  vec2 texCoordSlice1, texCoordSlice2;
  texCoordSlice1 = texCoordSlice2 = texCoord;

  // Add an offset to the original UV coordinates depending on the row and column number.
  texCoordSlice1.x += (mod(zSliceNumber1, tileCountX - 0.0 ));
  texCoordSlice1.y += floor(zSliceNumber1 / (tileCountX - 0.0) );
  // ratio mix between slices
  //float zRatio = mod(vecCur.z * (volumeSizeZ), 1.0);
  texCoordSlice2.x += (mod(zSliceNumber2, tileCountX - 0.0 ));
  texCoordSlice2.y += floor(zSliceNumber2 / (tileCountX - 0.0));

  // add 0.5 correction to texture coordinates
  float xSize = float(xDim);
  float ySize = float(yDim);
  vec2 vAdd = vec2(0.5 / xSize, 0.5 / ySize);
  texCoordSlice1 += vAdd;
  texCoordSlice2 += vAdd;

  // get colors from neighbour slices
  float colorSlice1 = texture2D(texVolume, clamp(texCoordSlice1 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
  float colorSlice2 = texture2D(texVolume, clamp(texCoordSlice2 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
  return mix(colorSlice1, colorSlice2, zRatio);
}

/**
* Calculation of normal
*/
vec3 calcNormal(vec3 iter)
{
  float d = 1.0 / texSize;
  vec3 dx = vec3(d, 0.0, 0.0), dy = vec3(0.0, d, 0.0), dz = vec3(0.0, 0.0, d), N;
  // Calculate normal
  N.x = tex3D(iter + dx) - tex3D(iter - dx);
  N.y = tex3D(iter + dy) - tex3D(iter - dy);
  N.z = tex3D(iter + dz) - tex3D(iter - dz);
  N = normalize(N);
  return -N;
}

/**
* Rotate sampling vector around the normal
*/
vec3 transform2TangentSpace(vec3 normal, vec3 dir)
{
  vec3 binormal = cross(normal, vec3(1.0, 0.0, 0.0));
  vec3 tangent = cross(normal, binormal);
  mat3 rotate = mat3(tangent, binormal, normal);
  return rotate * dir;
}

/**
* Check tex3d space point depth against the isosurface map
*/
bool isPointVisible(vec3 texel) {
  // Transform from tex3D space to screen
  vec4 screenSpacePos = (local2ScreenMatrix * vec4(-texel.x, texel.y, texel.z, 1.0));
  vec2 tc = screenSpacePos.xy / screenSpacePos.w * 0.5 + 0.5;
  // Take start ray point, end ray point and check ray length against 'texel' position

  vec4 backTexel = texture2D(texBF, tc, 0.0);
  vec3 back = backTexel.xyz;
  vec4 start = texture2D(texFF, tc, 0.0);
  if (backTexel.a < 0.5)
  {
    return true;
  }
  vec3 dir = normalize(back - start.xyz);
  float isosurfDist = texture2D(texIsosurfFrame, tc, 0.0).a;

  return isosurfDist > length(start.xyz - texel);
}

/**
* Compute coverage for a single point
*/
float computeCoverage(vec3 isosurfPoint) {
  float texelSize = 1.0 / texSize;
  float coverage = 0.0;
  float deltaCov = 1.0 / float(nOffsets);
  // Go through all offsets
  vec3 norm = calcNormal(isosurfPoint);
  for (int i = 0; i < nOffsets; ++i) {
    if (isPointVisible(isosurfPoint + transform2TangentSpace(norm, offsets[i] * texelSize * 9.0)))
      coverage += deltaCov;
  }
  return coverage;
}

void main() {
  vec2 tc = screenpos.xy / screenpos.w * 0.5 + 0.5;

  vec4 backTexel = texture2D(texBF, tc, 0.0);
  vec3 back = backTexel.xyz;
  vec4 start = texture2D(texFF, tc, 0.0);
  if (backTexel.a < 0.5)
  {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }
  vec3 dir = normalize(back - start.xyz);
  float isosurfDist = texture2D(texIsosurfFrame, tc, 0.0).a;
  vec3 isosurfPt = start.xyz + dir * isosurfDist;

  vec3 color = texture2D(texColorFrame, tc, 0.0).xyz;
  float shadow = computeCoverage(isosurfPt);
  gl_FragColor = vec4(shadow, shadow, shadow, 1.0);
  //gl_FragColor = vec4(color.xxx, 1.0);

  //vec4 screenSpacePos = (local2ScreenMatrix * vec4(-isosurfPt.x, isosurfPt.y, isosurfPt.z, 1.0));
  //tc = screenSpacePos.xy / screenSpacePos.w * 0.5 + 0.5;
  //color = texture2D(texColorFrame, tc, 0.0).xyz;
  //gl_FragColor = vec4(color, 1.0);
}
