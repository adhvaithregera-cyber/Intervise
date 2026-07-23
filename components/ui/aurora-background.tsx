'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// GLSL simplex noise + gold/amber aurora shader adapted to #080d1a brand palette
const fragmentShader = `
  uniform float time;
  varying vec2 vUv;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;

    // Flowing noise layers (slow, dreamy movement)
    float flow1 = snoise(vec2(uv.x * 1.8 + time * 0.07, uv.y * 0.6 + time * 0.04));
    float flow2 = snoise(vec2(uv.x * 1.2 + time * 0.05, uv.y * 0.9 + time * 0.03));
    float flow3 = snoise(vec2(uv.x * 2.5 + time * 0.09, uv.y * 0.4 + time * 0.06));

    // Soft streaky aurora bands
    float streaks = sin((uv.x + flow1 * 0.25) * 6.0 + time * 0.15) * 0.5 + 0.5;
    streaks *= sin((uv.y + flow2 * 0.18) * 9.0 + time * 0.12) * 0.5 + 0.5;

    float aurora = (flow1 + flow2 + flow3) * 0.33 + 0.5;
    aurora = pow(aurora, 2.2);

    // Brand palette: navy base → deep amber → gold
    // #080d1a  → (0.031, 0.051, 0.102)
    // deep amber glow (very muted)
    // gold #F9C125 → (0.976, 0.757, 0.145) — used sparingly as highlight
    vec3 navy      = vec3(0.031, 0.051, 0.102);
    vec3 darkAmber = vec3(0.10,  0.065, 0.008);
    vec3 midAmber  = vec3(0.22,  0.13,  0.015);
    vec3 gold      = vec3(0.42,  0.27,  0.04);
    vec3 brightGold= vec3(0.65,  0.45,  0.08);

    vec3 color = navy;

    // Layer 1 — dark amber wash
    float l1 = smoothstep(0.25, 0.65, aurora + streaks * 0.25);
    color = mix(color, darkAmber, l1 * 0.85);

    // Layer 2 — mid amber flow
    float l2 = smoothstep(0.55, 0.85, aurora + flow1 * 0.35);
    color = mix(color, midAmber, l2 * 0.70);

    // Layer 3 — gold core
    float l3 = smoothstep(0.75, 0.96, streaks + aurora * 0.45);
    color = mix(color, gold, l3 * 0.45);

    // Layer 4 — bright gold accent (very sparse)
    float l4 = smoothstep(0.92, 1.0, aurora + flow3 * 0.25);
    color = mix(color, brightGold, l4 * 0.20);

    // Micro texture
    float grain = snoise(uv * 90.0) * 0.012;
    color = max(vec3(0.0), color + grain);

    gl_FragColor = vec4(color, 1.0);
  }
`

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

function AuroraScene() {
  const { scene } = useThree()
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)

  useEffect(() => {
    const geometry = new THREE.PlaneGeometry(200, 200)
    const material = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    })
    materialRef.current = material
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.z = -50
    scene.add(mesh)
    return () => {
      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
    }
  }, [scene])

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += 0.008
    }
  })

  return null
}

function CameraController() {
  const { camera } = useThree()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    camera.position.x = Math.sin(t * 0.04) * 2
    camera.position.y = Math.cos(t * 0.06) * 1.5
    camera.position.z = 30
    camera.lookAt(0, 0, -30)
  })
  return null
}

function AuroraCanvas() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[2]">
      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <AuroraScene />
        <CameraController />
      </Canvas>
    </div>
  )
}

// Dynamically imported so it only runs client-side (no SSR)
const AuroraBackground = dynamic(() => Promise.resolve(AuroraCanvas), { ssr: false })

export default AuroraBackground
