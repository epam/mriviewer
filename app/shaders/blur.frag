/**
* Pixel shader for filtering source dates and nolmals calculation
*/
uniform sampler2D texVolume;
varying vec2 texCoord;
uniform vec3 texelSize;

uniform float tileCountX;
uniform float volumeSizeZ;


/**
* Reading from 3D texture  
*/
  vec4 tex3D(vec3 vecCur) {
  float tCX = 1.0/tileCountX;
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  // check outside of texture volume
  if ((vecCur.x < 0.0) || (vecCur.y < 0.0) || (vecCur.z < 0.0) || (vecCur.x > 1.0) ||  (vecCur.y > 1.0) || (vecCur.z > 1.0))
    return vec4(0.0, 0.0, 0.0, 0.0);
  float zSliceNumber1 = floor(vecCur.z  * (volumeSizeZ - 1.0));
  // As we use trilinear we go the next Z slice.
  float zSliceNumber2 = min( zSliceNumber1 + 1.0, (volumeSizeZ - 1.0)); //Clamp to 255
  // The Z slices are stored in a matrix of 16x16 of Z slices.
  // The original UV coordinates have to be rescaled by the tile numbers in each row and column.
  //vec2 texCoord = vecCur.xy / 16.0;
  vec2 texCoord = vecCur.xy * tCX;
  vec2 texCoordSlice1, texCoordSlice2;
  texCoordSlice1 = texCoordSlice2 = texCoord;

  // Add an offset to the original UV coordinates depending on the row and column number.
  texCoordSlice1.x += (mod(zSliceNumber1, tileCountX )*tCX);
  texCoordSlice1.y += floor(zSliceNumber1 / tileCountX)*tCX;
  
  texCoordSlice2.x += (mod(zSliceNumber2, tileCountX )*tCX);
  texCoordSlice2.y += floor(zSliceNumber2 / tileCountX)*tCX;
  vec4 colorSlice1 = texture2D(texVolume, texCoordSlice1, 0.0);
  vec4 colorSlice2 = texture2D(texVolume, texCoordSlice2, 0.0);
  // ratio mix between slices
  float zRatio = mod(vecCur.z * (volumeSizeZ - 1.0), 1.0);
  return colorSlice1 * (1.0 - zRatio) + colorSlice2 * zRatio;
}

/**
* Calculate 3D texture coordinates  
*/
vec3 getTex3DCoord(vec2 base) {
  vec3 res;
  //extract z-component from the base
  float z = floor(base.x * tileCountX) + floor(base.y * tileCountX) * tileCountX;
  res.z = z / (volumeSizeZ - 1.0);
  res.xy = base.xy;
  res.x -= mod(z, tileCountX ) / tileCountX;
  res.y -= floor(z / tileCountX) / tileCountX;
  res.xy = res.xy * tileCountX;
  return res - vec3(0.5, 0.5, 0.5);
}

void main() {
  vec3 base = getTex3DCoord(texCoord);
  vec4 acc = vec4(0.0, 0.0, 0.0, 0.0);
  float sigma = 1.2;//0.965;
  float sigma2 = sigma*sigma;
  float sigmaD = 1.2;//0.965;
  float sigmaD2 = sigmaD*sigmaD;
  float sigmaB = 1.2;//0.9515;
  float sigmaB2 = sigmaB*sigmaB;
 
  float val = tex3D(base).r;
  float norm_factor = 0.0;
  float norm_factorB = 0.0;
  //Bilateral Filtering 
  for (float i = -2.0; i < 2.5; i += 1.0)
    for (float j = -2.0; j < 2.5; j += 1.0)
      for (float k = -2.0; k < 2.5; k += 1.0)
      {
        float curVal = tex3D(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k)).r;
        float gaussB = exp( -(i*i + j*j + k*k) / (2.0 * sigma2));// - (val - curVal)*(val - curVal) / (2.0 * sigmaB2) );
//        float gaussB = exp( -(i*i + j*j + k*k) / (2.0 * sigma2) - (val - curVal)*(val - curVal) / (2.0 * sigmaB2) );
        float gaussW = exp( -(i*i + j*j + k*k) / (2.0 * sigmaD2) ) / (2.0 * 3.1415 * sigmaD2);
        acc.r += curVal * gaussW * (-i / sigmaD2);
        acc.g += curVal * gaussW * (-j / sigmaD2);
        acc.b += curVal * gaussW * (-k / sigmaD2);
        acc.a += curVal * gaussB;
        norm_factor += gaussW;
        norm_factorB += gaussB;
      }
  // normal
  acc.rgb = acc.rgb / norm_factor + vec3(0.5, 0.5, 0.5);
  // intencity
  acc.a = acc.a / norm_factorB;
  gl_FragColor = acc;
}
