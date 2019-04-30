/**
* Pixel shader for filtering source dates and nolmals calculation
*/
#if useWebGL2 == 1
precision highp sampler3D;
uniform sampler3D texVolume;
uniform sampler3D texVolumeRoi;
#else
uniform sampler2D texVolume;
uniform sampler2D texVolumeRoi;
#endif
uniform sampler2D texSegInUse;
uniform sampler2D texRoiColor;
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
uniform float curZ;

/**
* Reading from 3D texture
*/
float tex3D(vec3 vecCur) {
  float tCX = 1.0 / tileCountX;
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);// + texelSize * 0.5;
  // check outside of texture volume
  //if ((vecCur.z < 0.5*texelSize.z) || (vecCur.z >= 1.0 - 0.5*texelSize.z))
    //return 0.0;
  //if (vecCur.z < 0.5*texelSize.z) vecCur.z = 0.5*texelSize.z;
  //if (vecCur.z > 1.0 - 0.5*texelSize.z) vecCur.z = 1.0 - 0.5*texelSize.z;
  return texture(texVolume, vecCur).r;
}

float tex3DRoi(vec3 vecCur) {
  float tCX = 1.0 / tileCountX;
  vecCur = vecCur + vec3(0.5, 0.5, 0.5);
  // check outside of texture volume
  //if ((vecCur.x < 0.0) || (vecCur.y < 0.0) || (vecCur.z < 0.0) || (vecCur.x > 1.0) ||  (vecCur.y > 1.0) || (vecCur.z > 1.0))
    //return 0.0;
  return texture(texVolumeRoi, vecCur).r;
}

vec4 filterROI(vec3 base)
{
  float sigma = blurSigma;//0.965;
  float sigma2 = sigma*sigma;
  float norm_factor = 0.0;
  vec4 acc = vec4(0.0, 0.0, 0.0, 0.0);
  vec3 BackGroundColor = vec3(0.0, 0.0, 0.0);
  vec3  sumColor = vec3(0.0, 0.0, 0.0);
  // intencity
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
        //float val = 0.5 * curVal;
        acc.a += val * gaussB;
        norm_factor += gaussB;
      }
  acc.a = acc.a / norm_factor;
  // color
  norm_factor = 0.0;
  for (float i = -1.0; i < 1.5; i += 1.0)
    for (float j = -1.0; j < 1.5; j += 1.0)
      for (float k = -1.0; k < 1.5; k += 1.0)
      {
        //float curVal = tex3D(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k));
        float curRoi = tex3DRoi(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k));
        float gaussB = exp( -(i*i + j*j + k*k) / (2.0 * sigma2));
        //pick selected roi from 1d texture
        float segInUse = texture2D(texSegInUse, vec2(curRoi, 0.0)).r;
        vec3 segColor = texture2D(texRoiColor, vec2(curRoi, 0.0)).rgb;
        sumColor += mix(BackGroundColor, segColor, segInUse) * gaussB;
        //sumColor += segColor * gaussB;
        norm_factor += segInUse * gaussB;
      }
  if (norm_factor > 0.01)
    acc.rgb = sumColor / norm_factor;
  
  //float curRoi = tex3DRoi(base);
  //acc.rgb = texture2D(texRoiColor, vec2(curRoi, 0.0)).rgb;

  //acc.rgb
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
  vec3 base;
  base.xy = texCoord;
  base.z = curZ;
  base = base - vec3(0.5, 0.5, 0.5);
  vec4 acc = vec4(0.0, 0.0, 0.0, 1.0);
  float val; 
  #if renderRoiMap == 1
    acc = filterROI(base);
  #else
    val = filterBlur(base);
    acc = vec4(val, val, val, 1);
  #endif
  
  gl_FragColor = acc;
}
