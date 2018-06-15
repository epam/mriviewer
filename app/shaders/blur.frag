/**
* Pixel shader for filtering source dates and nolmals calculation
*/
uniform sampler2D texVolume;
uniform sampler2D texVolumeRoi;
uniform sampler2D texSegInUse;
varying vec2 texCoord;
uniform vec3 texelSize;

uniform float tileCountX;
uniform float volumeSizeZ;
uniform float blurSigma;
uniform float contrast;
uniform float brightness;
uniform bool save_flag;

uniform float xDim;
uniform float yDim;

/**
* Reading from 3D texture
*/

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

float tex3DRoi(vec3 vecCur) {
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
  float colorSlice1 = texture2D(texVolumeRoi, clamp(texCoordSlice1 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
//  float colorSlice2 = texture2D(texVolumeRoi, clamp(texCoordSlice2 * tCX, vec2(0.0, 0.0), vec2(1.0, 1.0)), 0.0).a;
//  return mix(colorSlice1, colorSlice2, zRatio);
  
  return colorSlice1;
//  return colorSlice1;
}


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
/*vec4 filterROI(vec3 base)
{
  float sigma = blurSigma;//0.965;
  float sigma2 = sigma*sigma;
  float sigmaD = blurSigma;//0.965;
  float sigmaD2 = sigmaD*sigmaD;
  float sigmaB = blurSigma;//0.9515;
  float sigmaB2 = sigmaB*sigmaB;
  vec3 BackGroundColor = vec3(0.0, 0.0, 0.0);
  float norm_factor = 0.0;
  float seg_norm_factor = 0.0;
  vec3  segColor;
  vec4 acc = vec4(0.0, 0.0, 0.0, 0.0);
  for (float i = -2.0; i < 2.5; i += 1.0)
    for (float j = -2.0; j < 2.5; j += 1.0)
      for (float k = -2.0; k < 2.5; k += 1.0)
      {
        vec curVal = tex3D(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k));
        vec curRoi = tex3D(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k));
        float gaussB = exp( -(i*i + j*j + k*k) / (2.0 * sigma2));
        //pick selected roi from 1d texture
        float segInUse = texture2D(texSegInUse, vec2(curRoi, 0.0));
        segColor = texture2D(texSegColorPalette, vec2(curRoi.a, 0.0)).rgb;
        //acc.rgb += (segInUse * segColor + (1.0 - segInUse) * BackGroundColor) * gaussB;
        acc.rgb += mix(BackGroundColor, segColor, segInUse) * gaussB;
        float val = max(0.5 * curVal, segInUse);
//        float val = curVal.a *segInUse;
        acc.a += val * gaussB;
        seg_norm_factor += segInUse * gaussB;
        norm_factor += gaussB;
      }
  // color
  if (seg_norm_factor > 0.01)
    acc.rgb = acc.rgb / seg_norm_factor;
  // intencity
  acc.a = acc.a / norm_factor;
  //gl_FragColor = acc;
  return acc;
}
*/
float filterROI(vec3 base)
{
  float sigma = blurSigma;//0.965;
  float sigma2 = sigma*sigma;
  float norm_factor = 0.0;
  float acc = 0.0;
  for (float i = -2.0; i < 2.5; i += 1.0)
    for (float j = -2.0; j < 2.5; j += 1.0)
      for (float k = -2.0; k < 2.5; k += 1.0)
      {
        float curVal = tex3D(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k));
        float curRoi = tex3DRoi(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k));
        float gaussB = exp( -(i*i + j*j + k*k) / (2.0 * sigma2));
        //pick selected roi from 1d texture
        float segInUse = texture2D(texSegInUse, vec2(curRoi, 0.0)).r;
        float val = max(0.5 * curVal, segInUse);
        acc += val * gaussB;
        norm_factor += gaussB;
      }
  // intencity
  acc = acc / norm_factor;
//  acc = tex3DRoi(base);  //gl_FragColor = acc;
//   float curRoi_ = tex3DRoi(base);
//    acc = texture2D(texSegInUse, vec2(curRoi_, 0.0)).r;
//    acc = tex3D(base);
//    acc = curRoi_;
  return acc;
}


float filterBlur(vec3 base)
{
  float acc = 0.0;
  float sigma = blurSigma;//0.965;
  float sigma2 = sigma*sigma;
  float sigmaD = blurSigma;//0.965;
  float sigmaD2 = sigmaD*sigmaD;
  float sigmaB = blurSigma;//0.9515;
  float sigmaB2 = sigmaB*sigmaB;
  float val = tex3D(base);
  float norm_factor = 0.0;
  float norm_factorB = 0.0;

  bool skip = false;
  /*if(save_flag == false){
      return acc;
  }
 */ //Bilateral Filtering
  if(skip == false)
  {
    for (float i = -2.0; i < 2.5; i += 1.0)
      for (float j = -2.0; j < 2.5; j += 1.0)
        for (float k = -2.0; k < 2.5; k += 1.0)
        {
          float curVal = tex3D(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k));
//          float gaussB = exp( -(i*i + j*j + k*k) / (2.0 * sigma2));// - (val - curVal)*(val - curVal) / (2.0 * sigmaB2) );
          float gaussW = exp( -(i*i + j*j + k*k) / (2.0 * sigmaD2) ); // (2.0 * 3.1415 * sigmaD2);
          acc += curVal * gaussW;
          norm_factorB += gaussW;
        }
   }
  // intencity
  acc = acc / norm_factorB;
  return acc;
}

void main() {
  vec3 base = getTex3DCoord(texCoord);
//  vec4 acc = vec4(0.0, 0.0, 0.0, 0.0);
  float acc = 0.0;
  #if renderRoiMap == 1
    acc = filterROI(base);
  #else
    acc = filterBlur(base);
  #endif
  //Apply contrast/brightness adjustments
  //acc = contrast * (acc - 0.5) + 0.5 + brightness;
  gl_FragColor = vec4(acc, acc, acc, 1);
}
