import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDragRotate } from './useDragRotate'

/**
 * Ledger Grid: bidang poligon yang bergelombang mengikuti kursor.
 * Vertex displacement dihitung di shader — murah, tidak membebani main thread.
 */
const vertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  varying float vElevation;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    float d = distance(uv, uPointer * 0.5 + 0.5);
    float wave = sin(p.x * 2.2 + uTime * 0.8) * 0.16
               + sin(p.y * 2.8 - uTime * 0.6) * 0.12;
    float ripple = smoothstep(0.55, 0.0, d) * 0.55;
    p.z += wave + ripple;
    vElevation = p.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform vec3 uLow;
  uniform vec3 uHigh;
  varying float vElevation;
  varying vec2 vUv;

  void main() {
    float m = smoothstep(-0.3, 0.7, vElevation);
    vec3 col = mix(uLow, uHigh, m);
    float edgeFade = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x)
                   * smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
    gl_FragColor = vec4(col, 0.55 * edgeFade + 0.08);
  }
`

export default function LedgerGrid({ low = '#1b2430', high = '#3fd8c2' }) {
  const mesh = useRef()
  const gl = useThree((s) => s.gl)
  const { step } = useDragRotate(gl.domElement, { sensitivity: 0.003 })

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uLow: { value: new THREE.Color(low) },
      uHigh: { value: new THREE.Color(high) }
    }),
    [low, high]
  )

  useFrame((state, dt) => {
    const s = step()
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uPointer.value.x = THREE.MathUtils.damp(uniforms.uPointer.value.x, s.pointer.x, 4, dt)
    uniforms.uPointer.value.y = THREE.MathUtils.damp(uniforms.uPointer.value.y, -s.pointer.y, 4, dt)
    if (mesh.current) {
      mesh.current.rotation.z = s.ry * 0.4
      mesh.current.rotation.x = -1.05 + s.rx * 0.25
    }
  })

  return (
    <group position={[0, -0.4, 0]}>
      <mesh ref={mesh} rotation={[-1.05, 0, 0]}>
        <planeGeometry args={[9, 9, 60, 60]} />
        <shaderMaterial
          vertexShader={vertex}
          fragmentShader={fragment}
          uniforms={uniforms}
          transparent
          wireframe
        />
      </mesh>
    </group>
  )
}
