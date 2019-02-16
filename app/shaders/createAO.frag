/**
* Pixel shader for filtering source dates and nolmals calculation
*/
#if useWebGL2 == 0
uniform sampler2D texVolume;
#endif
#if useWebGL2 == 1
precision highp sampler3D;
uniform sampler3D texVolume;
#endif
const int nVec = 1000;
uniform sampler2D vectorsTex;
varying vec2 texCoord;
uniform vec3 texelSize;

uniform float tileCountX;
uniform float volumeSizeZ;
uniform float xDim;
uniform float yDim;
uniform float curZ;
uniform float isoThreshold;
uniform int vectorsSize;

/**
* Reading from 3D texture
*/
#if useWebGL2 == 0
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

  texCoordSlice2.x += (mod(zSliceNumber2, tileCountX - 0.0 ));
  texCoordSlice2.y += floor(zSliceNumber2 / (tileCountX - 0.0));

  // add 0.5 correction to texture coordinates
  vec2 vAdd = vec2(0.5 / xDim, 0.5 / yDim);
  texCoordSlice1 += vAdd;
  texCoordSlice2 += vAdd;

  // get colors from neighbour slices
  float colorSlice1 = texture2D(texVolume, clamp(texCoordSlice1 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
  float colorSlice2 = texture2D(texVolume, clamp(texCoordSlice2 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
  return mix(colorSlice1, colorSlice2, zRatio);
}
#else
float tex3D(vec3 vecCur) {
  float xSize = float(xDim);
  float ySize = float(yDim);
  float zSize = float(volumeSizeZ);
  vec3 vAdd = vec3(0.5 / xSize, 0.5 / ySize, 0.5 / zSize);
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  if ((vecCur.x < 0.0) || (vecCur.y < 0.0) || (vecCur.z < 0.0) || (vecCur.x > 1.0) ||  (vecCur.y > 1.0) || (vecCur.z > 1.0))
    return 0.0;
  /*if (all(lessThan(vecCur.xy, vec2(0.001))) ||
      all(lessThan(vecCur.xz, vec2(0.001))) || 
	  all(lessThan(vecCur.zy, vec2(0.001))) )
	return 0.0;
  if (all(greaterThan(vecCur.xy, vec2(0.999))) ||
      all(greaterThan(vecCur.xz, vec2(0.999))) || 
	  all(greaterThan(vecCur.zy, vec2(0.999))) )
	return 0.0;*/
//  return texture(texVolume, vecCur + vAdd).r;
  return texture(texVolume, vecCur).r;
}
#endif
/**
* Calculate 3D texture coordinates
*/

vec3 getTex3DCoord(vec2 base) {
  vec3 res;
  //extract z-component from the base
  vec2 vAdd = vec2(0.5 / (xDim * tileCountX), 0.5 / (yDim * tileCountX));
  res.xy = base.xy - vAdd;
  float z = floor(res.x * tileCountX) + floor(res.y * tileCountX) * tileCountX;
  res.z = z / (volumeSizeZ - 1.0);
  res.x -= mod(z, tileCountX ) / tileCountX;
  res.y -= floor(z / tileCountX) / tileCountX;
  res.xy = res.xy * tileCountX;

  return res - vec3(0.5, 0.5, 0.5);
}

/**
* Calculation of normal
*/
vec3 CalcNormal(vec3 iter)
{
  vec3 dx = vec3(texelSize.x, 0.0, 0.0), dy = vec3(0.0, texelSize.x, 0.0), dz = vec3(0.0, 0.0, texelSize.x), N;
  // Culculate normal
  N.x = tex3D(iter + dx) - tex3D(iter - dx);
  N.y = tex3D(iter + dy) - tex3D(iter - dy);
  N.z = tex3D(iter + dz) - tex3D(iter - dz);
  return N;
}

float ao(vec3 base){
  const float TWICE = 2.0;
  float STEPSIZE = texelSize.z;
  const int STEPCOUNT = 16;
  float res = 1.0;
  float fVectorsSize = float(vectorsSize);
  float reverseVectorSize = 1.0 / fVectorsSize;
  vec3 normal = -CalcNormal(base);
  if (length(normal) < 1.0/256.0 || tex3D(base) < 0.75 * isoThreshold)
    return 1.0;
  normal = normalize(normal);
  vec3 currentVox;
  float tempBase = isoThreshold; //tex3D(base);
//  float tempBase = tex3D(base);
  float t = 0.0;
  for(int i = 0; i < vectorsSize; i++){ //the ray selection
      vec3 currentVectorTex = texture2D(vectorsTex, vec2(t, 0.0), 0.0).rgb;
	  t += reverseVectorSize;
      currentVectorTex -= vec3(0.5);
      normalize(currentVectorTex);
      if(dot(normal, currentVectorTex) > 0.0){ //we walk along the ray
	    currentVox = base + STEPSIZE * normal;//currentVectorTex; 
        for(int step = 0; step < STEPCOUNT; step++){
            currentVox += 2.0*STEPSIZE * currentVectorTex;
            if((tex3D(currentVox) > tempBase)){
			     res = res - TWICE * reverseVectorSize;
                 break;
            }
        }
      }
  }
  return max(0.0, res);
}


void main() {
  //vec3 base = getTex3DCoord(texCoord);
  vec3 base;
  base.xy = texCoord;
  base.z = curZ;
  base = base - vec3(0.5, 0.5, 0.5);
  vec4 acc = vec4(0.0, 0.0, 0.0, 1.0);
  float val = 0.99;
  val = ao(base);
  acc = vec4(val, val, val, 1);

  gl_FragColor = acc;
}

