import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup.jsx'

/**
 * SCENE 2 — "Mesh Network"
 * Graf node vector: bola-bola low-poly yang terhubung garis.
 * Hover node -> node menyala & membesar. Drag -> memutar seluruh graf.
 * Node aktif disinkronkan dengan daftar fitur di sisi kiri.
 */

function useGraph(count, radius) {
  return useMemo(() => {
    const nodes = []
    // distribusi fibonacci sphere -> persebaran rapi, tidak menggumpal
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = golden * i
      nodes.push(
        new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
      )
    }

    const edges = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < radius * 0.82) {
          edges.push(nodes[i], nodes[j])
        }
      }
    }

    const geo = new THREE.BufferGeometry().setFromPoints(edges)
    return { nodes, edgeGeometry: geo }
  }, [count, radius])
}

function Node({ position, index, activeIndex, onHover }) {
  const ref = useRef()
  const [hovered, setHovered] = useState(false)
  const isActive = hovered || activeIndex === index

  useFrame((state, dt) => {
    if (!ref.current) return
    const target = isActive ? 1.9 : 1
    const cur = ref.current.scale.x
    ref.current.scale.setScalar(cur + (target - cur) * Math.min(dt * 8, 0.25))
  })

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        onHover(index)
      }}
      onPointerOut={() => {
        setHovered(false)
        onHover(null)
      }}
    >
      <octahedronGeometry args={[0.062, 0]} />
      <meshStandardMaterial
        color={isActive ? '#aab6ff' : '#5b657f'}
        emissive={isActive ? '#7c8cff' : '#242c3d'}
        emissiveIntensity={isActive ? 1.5 : 0.5}
        flatShading
        roughness={0.4}
        metalness={0.6}
      />
    </mesh>
  )
}

function Pulse({ nodes }) {
  const ref = useRef()
  const path = useMemo(() => {
    const picks = [0, 7, 15, 24, 33, 41]
    return picks.map((i) => nodes[i % nodes.length])
  }, [nodes])

  useFrame((state) => {
    if (!ref.current) return
    const t = (state.clock.elapsedTime * 0.22) % 1
    const seg = t * (path.length - 1)
    const i = Math.floor(seg)
    const f = seg - i
    const a = path[i]
    const b = path[Math.min(i + 1, path.length - 1)]
    ref.current.position.lerpVectors(a, b, f)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.05, 12, 12]} />
      <meshBasicMaterial color="#3fbfae" />
    </mesh>
  )
}

export default function NetworkMesh({ activeIndex = null, onNodeHover = () => {} }) {
  const { nodes, edgeGeometry } = useGraph(46, 1.85)

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} color="#cfd6ff" />
      <pointLight position={[-3, -2, 2]} intensity={6} color="#3fbfae" distance={10} />

      <DragGroup autoSpin={0.1} sensitivity={0.0045}>
        <lineSegments geometry={edgeGeometry}>
          <lineBasicMaterial color="#5566aa" transparent opacity={0.28} />
        </lineSegments>

        {nodes.map((p, i) => (
          <Node
            key={i}
            index={i}
            position={p}
            activeIndex={activeIndex}
            onHover={onNodeHover}
          />
        ))}

        <Pulse nodes={nodes} />

        <mesh>
          <sphereGeometry args={[1.84, 32, 32]} />
          <meshBasicMaterial color="#0a0f1a" transparent opacity={0.5} side={THREE.BackSide} />
        </mesh>
      </DragGroup>
    </>
  )
}
