import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, fibonacciSphere } from '../geo'

/**
 * Network: bola simpul validator. Hover sebuah simpul → simpul membesar
 * dan garis-garis yang terhubung padanya menyala.
 */
function Node({ position, index, activeIndex, setActive }) {
  const ref = useRef()
  const isActive = activeIndex === index

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = frame.clock.elapsedTime
    if (!ref.current) return
    const base = 1 + Math.sin(t * 1.5 + index) * 0.08
    ref.current.scale.setScalar(
      THREE.MathUtils.damp(ref.current.scale.x, isActive ? base * 2.1 : base, 8, dt)
    )
    ref.current.material.emissiveIntensity = THREE.MathUtils.damp(
      ref.current.material.emissiveIntensity,
      isActive ? 2.6 : 0.6,
      8,
      dt
    )
  })

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setActive(index)
      }}
      onPointerOut={() => setActive(-1)}
    >
      <octahedronGeometry args={[0.075, 0]} />
      <meshStandardMaterial
        color={isActive ? PALETTE.teal : PALETTE.mist}
        emissive={isActive ? PALETTE.teal : PALETTE.indigo}
        emissiveIntensity={0.6}
        roughness={0.35}
        metalness={0.5}
        flatShading
      />
    </mesh>
  )
}

function Mesh3D({ count = 54 }) {
  const [active, setActive] = useState(-1)
  const nodes = useMemo(() => fibonacciSphere(count, 2.15), [count])

  const links = useMemo(() => {
    const pairs = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 0.92) pairs.push([i, j])
      }
    }
    return pairs
  }, [nodes])

  const { baseGeo, litGeo } = useMemo(() => {
    const basePts = []
    const litPts = []
    links.forEach(([a, b]) => {
      const target = active >= 0 && (a === active || b === active) ? litPts : basePts
      target.push(nodes[a], nodes[b])
    })
    return {
      baseGeo: new THREE.BufferGeometry().setFromPoints(basePts),
      litGeo: new THREE.BufferGeometry().setFromPoints(litPts)
    }
  }, [links, nodes, active])

  const shell = useRef()
  useFrame((_, delta) => {
    if (shell.current) shell.current.rotation.y += Math.min(delta, 0.05) * 0.06
  })

  return (
    <group ref={shell}>
      <lineSegments geometry={baseGeo}>
        <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.42} />
      </lineSegments>
      <lineSegments geometry={litGeo}>
        <lineBasicMaterial color={PALETTE.teal} transparent opacity={0.95} />
      </lineSegments>

      {nodes.map((p, i) => (
        <Node key={i} position={p} index={i} activeIndex={active} setActive={setActive} />
      ))}

      <mesh>
        <icosahedronGeometry args={[2.05, 1]} />
        <meshBasicMaterial color={PALETTE.slate} transparent opacity={0.08} />
      </mesh>
    </group>
  )
}

export default function NetworkMesh() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 4, 5]} intensity={0.9} color={PALETTE.mist} />
      <pointLight position={[-4, 2, -3]} intensity={16} color={PALETTE.indigo} distance={14} />

      <DragGroup autoSpin={0.45} parallax={0.3} scale={0.98}>
        <Mesh3D />
      </DragGroup>
    </>
  )
}
