import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, fibonacciSphere } from '../geo'

/**
 * Network: mesh validator berbentuk bola.
 * - Hover sebuah node → node membesar, tetangganya ikut menyala (paket lewat)
 * - Drag → memutar bola
 * Semua node dirender lewat satu InstancedMesh → ratusan node, satu draw call.
 */
const NODE_COUNT = 96
const RADIUS = 2.1

function Mesh({ onFocus }) {
  const instRef = useRef()
  const linesRef = useRef()
  const [hovered, setHovered] = useState(-1)

  const { nodes, links, linkGeo } = useMemo(() => {
    const nodes = fibonacciSphere(NODE_COUNT, RADIUS)
    const links = []
    const pts = []
    // sambungkan tiap node ke 2 tetangga terdekat — cukup untuk kesan mesh
    nodes.forEach((a, i) => {
      const near = nodes
        .map((b, j) => ({ j, d: a.distanceTo(b) }))
        .filter((x) => x.j !== i)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2)
      near.forEach(({ j }) => {
        if (i < j) {
          links.push([i, j])
          pts.push(a.clone(), nodes[j].clone())
        }
      })
    })
    const linkGeo = new THREE.BufferGeometry().setFromPoints(pts)
    return { nodes, links, linkGeo }
  }, [])

  const neighbours = useMemo(() => {
    const map = new Map()
    links.forEach(([a, b]) => {
      if (!map.has(a)) map.set(a, [])
      if (!map.has(b)) map.set(b, [])
      map.get(a).push(b)
      map.get(b).push(a)
    })
    return map
  }, [links])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorA = useMemo(() => new THREE.Color(PALETTE.mist), [])
  const colorB = useMemo(() => new THREE.Color(PALETTE.teal), [])
  const colorC = useMemo(() => new THREE.Color(PALETTE.indigo), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame((frame) => {
    const inst = instRef.current
    if (!inst) return
    const t = frame.clock.elapsedTime
    const active = neighbours.get(hovered) ?? []

    nodes.forEach((p, i) => {
      const isHover = i === hovered
      const isNear = active.includes(i)
      const pulse = 1 + Math.sin(t * 1.6 + i * 0.7) * 0.08
      const s = (isHover ? 2.6 : isNear ? 1.7 : 1) * 0.055 * pulse
      dummy.position.copy(p)
      dummy.scale.setScalar(s)
      dummy.rotation.set(t * 0.2 + i, t * 0.15 + i, 0)
      dummy.updateMatrix()
      inst.setMatrixAt(i, dummy.matrix)
      tmp.copy(isHover ? colorB : isNear ? colorC : colorA)
      inst.setColorAt(i, tmp)
    })

    inst.instanceMatrix.needsUpdate = true
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true

    if (linesRef.current) {
      linesRef.current.material.opacity = 0.12 + (hovered >= 0 ? 0.14 : 0) + Math.sin(t * 0.9) * 0.03
    }
  })

  return (
    <group>
      <instancedMesh
        ref={instRef}
        args={[undefined, undefined, NODE_COUNT]}
        onPointerMove={(e) => {
          e.stopPropagation()
          if (e.instanceId !== hovered) {
            setHovered(e.instanceId ?? -1)
            onFocus?.(e.instanceId ?? -1)
          }
        }}
        onPointerOut={() => {
          setHovered(-1)
          onFocus?.(-1)
        }}
      >
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          roughness={0.35}
          metalness={0.7}
          emissiveIntensity={0.4}
          flatShading
          toneMapped={false}
        />
      </instancedMesh>

      <lineSegments ref={linesRef} geometry={linkGeo}>
        <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.16} />
      </lineSegments>

      {/* cangkang tipis untuk memberi volume */}
      <mesh>
        <icosahedronGeometry args={[RADIUS * 0.99, 2]} />
        <meshBasicMaterial color={PALETTE.slate} transparent opacity={0.06} />
      </mesh>
    </group>
  )
}

export default function NetworkMesh({ onFocus }) {
  const { size } = useThree?.() ?? { size: null }
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} color={PALETTE.mist} />
      <pointLight position={[-4, 0, 3]} intensity={16} color={PALETTE.indigo} distance={14} />

      <DragGroup autoSpin={1} parallax={0.3} scale={size && size.width < 640 ? 0.85 : 1}>
        <Mesh onFocus={onFocus} />
      </DragGroup>
    </>
  )
}
