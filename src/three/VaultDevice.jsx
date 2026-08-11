import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDragRotate } from './useDragRotate'

/**
 * PRODUCT — "Vault Device": modul hardware low-poly.
 * Klik = exploded view (layer terpisah), hover per-layer = highlight + label.
 */
const LAYERS = [
  { key: 'shell', label: 'Titanium shell', y: 0.0, offset: 0.95, color: '#1a222c', accent: '#8ea3b5' },
  { key: 'se', label: 'Secure element', y: 0.0, offset: 0.32, color: '#12303a', accent: '#46c8b4' },
  { key: 'mesh', label: 'Anti-tamper mesh', y: 0.0, offset: -0.32, color: '#241f3d', accent: '#7c7ae0' },
  { key: 'base', label: 'Signing core', y: 0.0, offset: -0.95, color: '#2a2417', accent: '#c9974c' }
]

function Layer({ data, index, exploded, onHover, hovered }) {
  const mesh = useRef()
  const edges = useRef()
  const geo = useMemo(
    () => new THREE.CylinderGeometry(1.05 - index * 0.06, 1.05 - index * 0.06, 0.26, 6, 1),
    [index]
  )

  useFrame((st, dt) => {
    const d = Math.min(dt, 0.05)
    const t = st.clock.elapsedTime
    const targetY = exploded ? data.offset : index * 0.28 - 0.42
    const isHot = hovered === data.key
    if (mesh.current) {
      mesh.current.position.y = THREE.MathUtils.damp(mesh.current.position.y, targetY, 5, d)
      mesh.current.rotation.y = THREE.MathUtils.damp(
        mesh.current.rotation.y,
        exploded ? Math.sin(t * 0.4 + index) * 0.25 + index * 0.2 : 0,
        3,
        d
      )
      const sc = THREE.MathUtils.damp(mesh.current.scale.x, isHot ? 1.06 : 1, 7, d)
      mesh.current.scale.set(sc, 1, sc)
      mesh.current.material.emissiveIntensity = THREE.MathUtils.damp(
        mesh.current.material.emissiveIntensity,
        isHot ? 0.7 : 0.14,
        6,
        d
      )
    }
    if (edges.current) {
      edges.current.position.y = mesh.current ? mesh.current.position.y : targetY
      edges.current.rotation.y = mesh.current ? mesh.current.rotation.y : 0
      edges.current.material.opacity = THREE.MathUtils.damp(
        edges.current.material.opacity,
        isHot ? 0.95 : 0.4,
        6,
        d
      )
    }
  })

  return (
    <group>
      <mesh
        ref={mesh}
        geometry={geo}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(data.key)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          onHover(null)
        }}
      >
        <meshStandardMaterial
          color={data.color}
          flatShading
          metalness={0.85}
          roughness={0.32}
          emissive={data.accent}
          emissiveIntensity={0.14}
        />
      </mesh>
      <lineSegments ref={edges}>
        <edgesGeometry args={[geo]} attach="geometry" />
        <lineBasicMaterial color={data.accent} transparent opacity={0.4} />
      </lineSegments>
    </group>
  )
}

function Device({ onLabel }) {
  const { gl } = useThree()
  const { state, step } = useDragRotate(gl.domElement, { sensitivity: 0.006 })
  const group = useRef()
  const halo = useRef()
  const [exploded, setExploded] = useState(false)
  const [hovered, setHovered] = useState(null)

  const handleHover = (key) => {
    setHovered(key)
    onLabel(key ? LAYERS.find((l) => l.key === key)?.label ?? null : null)
    document.body.style.cursor = key ? 'pointer' : 'auto'
  }

  useFrame((st, dt) => {
    const s = step()
    const t = st.clock.elapsedTime
    const d = Math.min(dt, 0.05)
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        s.ry + t * 0.12 + s.pointer.x * 0.35,
        4,
        d
      )
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        s.rx + 0.22 - s.pointer.y * 0.18,
        4,
        d
      )
      group.current.position.y = Math.sin(t * 0.7) * 0.05
    }
    if (halo.current) {
      halo.current.rotation.z = t * 0.3
      halo.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.02)
    }
  })

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation()
        setExploded((v) => !v)
      }}
    >
      {LAYERS.map((l, i) => (
        <Layer
          key={l.key}
          data={l}
          index={i}
          exploded={exploded}
          hovered={hovered}
          onHover={handleHover}
        />
      ))}

      {/* halo heksagonal */}
      <mesh ref={halo} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.55, 0]}>
        <ringGeometry args={[1.5, 1.53, 6]} />
        <meshBasicMaterial color="#46c8b4" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.55, 0]}>
        <ringGeometry args={[2.1, 2.115, 6]} />
        <meshBasicMaterial color="#7c7ae0" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default function VaultDevice({ onLabel = () => {} }) {
  return (
    <>
      <ambientLight intensity={0.32} />
      <directionalLight position={[3, 5, 4]} intensity={1.15} color="#dbe9ff" />
      <pointLight position={[-4, 1, 3]} intensity={16} distance={14} color="#46c8b4" />
      <pointLight position={[4, -2, -3]} intensity={14} distance={14} color="#7c7ae0" />
      <Device onLabel={onLabel} />
    </>
  )
}
