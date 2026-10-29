// Shaders.metal — MRI volume ray-cast renderer (Metal 4, visionOS mixed immersion)

#include <metal_stdlib>
#include <simd/simd.h>
#import "ShaderTypes.h"

using namespace metal;

// Vertex input — layout must match buildMetalVertexDescriptor() in Renderer.swift
typedef struct {
    float3 position [[attribute(VertexAttributePosition)]];
    float2 texCoord [[attribute(VertexAttributeTexcoord)]]; // unused, kept for vertex descriptor compat
} VertexIn;

typedef struct {
    float4 position                            [[position]];
    float3 localPos;                           // position in volume local space [-0.5, 0.5]^3
    uint   viewIndex [[render_target_array_index]];
} VertexOut;

// MARK: - Vertex shader

vertex VertexOut volumeVertex(
    VertexIn                      in    [[stage_in]],
    ushort                        ampId [[amplification_id]],
    constant VolumeUniforms&      u     [[buffer(BufferIndexUniforms)]],
    constant ViewProjectionArray& vp    [[buffer(BufferIndexViewProjection)]]
) {
    VertexOut out;
    float4 worldPos  = u.modelMatrix * float4(in.position, 1.0);
    out.position     = vp.viewProjectionMatrix[ampId] * worldPos;
    out.localPos     = in.position;   // proxy cube is [-0.5, 0.5]^3
    out.viewIndex    = ampId;
    return out;
}

// MARK: - Fragment shader (max-intensity projection ray cast)

fragment float4 volumeFragment(
    VertexOut                             in     [[stage_in]],
    texture3d<float, access::sample>      volume [[texture(TextureIndexVolume)]],
    constant VolumeUniforms&              u      [[buffer(BufferIndexUniforms)]],
    constant ViewProjectionArray&         vp     [[buffer(BufferIndexViewProjection)]]
) {
    // Eye position transformed to volume local space
    float4 eyeWorld = vp.eyePositionWorld[in.viewIndex];
    float3 eyeLocal = (u.modelMatrixInv * eyeWorld).xyz;

    float3 dir = normalize(in.localPos - eyeLocal);

    // Ray-AABB slab test — volume occupies [-0.5, 0.5]^3
    float3 invDir  = 1.0 / dir;
    float3 t0      = (float3(-0.5) - eyeLocal) * invDir;
    float3 t1      = (float3( 0.5) - eyeLocal) * invDir;
    float3 tNear3  = min(t0, t1);
    float3 tFar3   = max(t0, t1);
    float  tEnter  = max(max(tNear3.x, tNear3.y), tNear3.z);
    float  tExit   = min(min(tFar3.x,  tFar3.y),  tFar3.z);

    if (tEnter > tExit || tExit < 0.0) {
        discard_fragment();
    }

    constexpr sampler vs(filter::linear, address::clamp_to_edge);
    float rangeInv = 1.0 / max(u.windowMax - u.windowMin, 1e-5);
    float maxVal   = 0.0;
    float t        = max(tEnter, 0.0);

    // MIP ray march — step through volume collecting max windowed intensity
    while (t < tExit) {
        float3 pos     = eyeLocal + t * dir;
        float3 texCoord = pos + 0.5;             // [-0.5,0.5] → [0,1]
        float  raw     = volume.sample(vs, texCoord).r;
        float  win     = clamp((raw - u.windowMin) * rangeInv, 0.0, 1.0);
        maxVal         = max(maxVal, win);
        t             += u.stepSize;
    }

    if (maxVal < 0.005) discard_fragment();      // transparent background
    return float4(maxVal, maxVal, maxVal, maxVal);
}
