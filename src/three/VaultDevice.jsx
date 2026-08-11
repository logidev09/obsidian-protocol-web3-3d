import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup.jsx'

/**
 * SCENE 3 — "The Device"
 * Perangkat vault fisik yang dibangun dari primitif (bukan model eksternal),
 * jadi tidak ada aset berat yang perlu di-load. Bisa diputar 360° dengan drag.
 * Hotspot bisa di-hover untuk memunculkan label komponen.
 */

const BODY = '#161b24'
const EDGE = '#2c3444'
const ACCENT = '#7c8cff'
const WARM = '#c9a86a'

function RoundedSlab({ w, h, d, r = 0.06, ...props }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    const x = -w / 2
    const y = -h / 2
    shape.moveTo(x + r, y)
    shape.lineTo(x + w - r, y)
    shape.quadraticCurveTo(x + w, y, x + w, y + r)
    shape.lineTo(x + w, y + h - r)
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    shape.lineTo(x + r, y + h)
    shape.quadraticCurveTo(x, y + h, x, y + h - r)
    shape.lineTo(x, y + r)
    shape.quadraticCurveTo(x, y, x + r, y)

    const g = new THREE.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: true,
      bevelSize: 0.014,
      bevelThickness: 0.014,
      bevelSegments: 2,
      curveSegments: 6
    })
    g.translate(0, 0, -d / 2)
    g.computeVertexNormals()
    return g
  }, [w, h, d, r])

  return <mesh geometry={geometry} {...props} />
}

function Hotspot({ position, label, onActive }) {
  const ref = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state, dt) => {
    if (!ref.current) return
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.12
    const target = (hovered ? 1.8 : 1) * pulse
    const cur = ref.current.scale.x
    ref.current.scale.setScalar(cur + (target - cur) * Math.min(dt * 9, 0.3))
  })

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        onActive(label)
      }}
      onPointerOut={() => {
        setHovered(false)
        onActive(null)
      }}
    >
      <sphereGeometry args={[0.038, 14, 14]} />
      <meshBasicMaterial color={hovered ? '#ffffff' : ACCENT} />
    </mesh>
  )
}

function ScreenGlow() {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.material.opacity = 0.5 + Math.sin(t * 1.5) * 0.1
  })
  return (
    <mesh ref={ref} position={[0, 0.32, 0.132]}>
      <planeGeometry args={[0.92, 0.62]} />
      <meshBasicMaterial color="#1d4f57" transparent opacity={0.55} />
    </mesh>
  )
}

function ScreenLines() {
  const group = useRef()
  const rows = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({ y: 0.54 - i * 0.085, w: 0.28 + Math.random() * 0.5 })),
    []
  )
  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.children.forEach((c, i) => {
      c.material.opacity = 0.35 + Math.sin(t * 1.8 + i * 0.9) * 0.3
    })
  })
  return (
    <group ref={group}>
      {rows.map((r, i) => (
        <mesh key={i} position={[-0.4 + r.w / 2, r.y, 0.134]}>
          <planeGeometry args={[r.w, 0.018]} />
          <meshBasicMaterial color="#59e0c8" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Device({ onActive }) {
  return (
    <group>
      {/* badan utama */}
      <RoundedSlab w={1.24, h: undefined} h={2.1} d={0.24} r={0.12}>
        <meshStandardMaterial color={BODY} roughness={0.42} metalness={0.72} />
      </RoundedSlab>

      {/* garis tepi wireframe */}
      <group>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.26, 2.12, 0.26]} />
          <meshBasicMaterial color={EDGE} wireframe transparent opacity={0.32} />
        </mesh>
      </group>

      {/* layar */}
      <mesh position={[0, 0.32, 0.126]}>
        <planeGeometry args={[0.96, 0.66]} />
        <meshStandardMaterial color="#080d13" roughness={0.2} metalness={0.4} />
      </mesh>
      <ScreenGlow />
      <ScreenLines />

      {/* d-pad / tombol navigasi */}
      <mesh position={[0, -0.42, 0.132]}>
        <torusGeometry args={[0.19, 0.032, 8, 32]} />
        <meshStandardMaterial color="#232a37" roughness={0.5} metalness={0.6} flatShading />
      </mesh>
      <mesh position={[0, -0.42, 0.15]}>
        <cylinderGeometry args={[0.072, 0.072, 0.03, 6]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#2e3747" roughness={0.45} metalness={0.65} flatShading />
      </mesh>

      {/* tombol samping */}
      <mesh position={[0.64, 0.55, 0]}>
        <boxGeometry args={[0.05, 0.24, 0.1]} />
        <meshStandardMaterial color="#39424f" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[-0.64, 0.35, 0]}>
        <boxGeometry args={[0.05, 0.18, 0.1]} />
        <meshStandardMaterial color="#39424f" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* port bawah */}
      <mesh position={[0, -1.06, 0]}>
        <boxGeometry args={[0.24, 0.05, 0.11]} />
        <meshStandardMaterial color="#0c1017" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* aksen emas tipis */}
      <mesh position={[0, -0.78, 0.126]}>
        <planeGeometry args={[0.5, 0.006]} />
        <meshBasicMaterial color={WARM} transparent opacity={0.7} />
      </mesh>

      {/* hotspot interaktif */}
      <Hotspot position={[0.42, 0.62, 0.16]} label="Secure element EAL6+" onActive={onActive} />
      <Hotspot position={[-0.44, -0.42, 0.16]} label="Tombol konfirmasi fisik" onActive={onActive} />
      <Hotspot position={[0.66, 0.55, 0.1]} label="Air-gap toggle" onActive={onActive} />
      <Hotspot position={[0, -1.06, 0.14]} label="USB-C · data terenkripsi" onActive={onActive} />
    </group>
  )
}

export default function VaultDevice({ onHotspot = () => {} }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} color="#d5dcff" />
      <directionalLight position={[-4, 1, -3]} intensity={0.8} color="#3fbfae" />
      <spotLight position={[0, 3, 4]} angle={0.6} penumbra={1} intensity={12} color="#7c8cff" />

      <DragGroup autoSpin={0.2} maxTilt={0.45}>
        <Device onActive={onHotspot} />
      </DragGroup>
    </>
  )
}
