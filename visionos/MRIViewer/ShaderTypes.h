//  ShaderTypes.h — types shared between Metal shaders and Swift

#ifndef ShaderTypes_h
#define ShaderTypes_h

#ifdef __METAL_VERSION__
#define NS_ENUM(_type, _name) enum _name : _type _name; enum _name : _type
typedef metal::int32_t EnumBackingType;
#else
#import <Foundation/Foundation.h>
typedef NSInteger EnumBackingType;
#endif

#include <simd/simd.h>

typedef NS_ENUM(EnumBackingType, BufferIndex) {
    BufferIndexUniforms       = 0,
    BufferIndexViewProjection = 1,
    BufferIndexMeshPositions  = 2,
    BufferIndexMeshGenerics   = 3,
};

typedef NS_ENUM(EnumBackingType, VertexAttribute) {
    VertexAttributePosition = 0,
    VertexAttributeTexcoord = 1,
};

typedef NS_ENUM(EnumBackingType, TextureIndex) {
    TextureIndexVolume = 0,
};

/// Per-frame stereo camera data — updated each frame from LayerRenderer.
typedef struct {
    matrix_float4x4 viewProjectionMatrix[2];
    simd_float4     eyePositionWorld[2];   // camera origin in world space, per eye
} ViewProjectionArray;

/// Per-draw volume rendering parameters — updated when volume or windowing changes.
typedef struct {
    matrix_float4x4 modelMatrix;           // volume → world
    matrix_float4x4 modelMatrixInv;        // world → volume local [-0.5, 0.5]^3
    float           windowMin;             // normalized 0..1 (maps to black)
    float           windowMax;             // normalized 0..1 (maps to white)
    float           stepSize;              // ray-march step in local coords
    float           _padding;
} VolumeUniforms;

#endif /* ShaderTypes_h */
