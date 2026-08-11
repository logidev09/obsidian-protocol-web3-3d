import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, fibonacciSphere, nearestPairs, getPerfProfile } from './geo'

/**
 * SECTION 3 - mesh validator.
 * Simpul-simpul di permukaan bola yang saling terhubung. Node membesar dan
 * menyala saat pointer mendekat; klik salah satu untuk "memilih" node itu.
 */

function Edges({ points, pairs }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(pairs.length * 6)
    pairs.forEach(([a, b], i) => {
      positions.set(
        [points[a].x, points[a].y, points[a].z, points[b].x, points[b].y, points[b].z],
        i * 6
      )
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [points, pairs])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.32} />
    </lineSegments>
  )
}

function Nodes({ points, onSelect, selected }) {
  const ref = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const base = useMemo(() => new THREE.Color(PALETTE.steel), [])
  const active = useMemo(() => new THREE.Color(PALETTE.teal), [])
  const pick = useMemo(() => new THREE.Color(PALETTE.copper), [])
  const pointerWorld = useMemo(() => new THREE.Vector3(), [])

  useFrame((frame) => {
    const m = ref.current
    if (!m) return
    const t = frame.clock.elapsedTime

    pointerWorld.set(frame.pointer.x, frame.pointer.y, 0.5).unproject(frame.camera)

    points.forEach((p, i) => {
      const world = p.clone().applyMatrix4(m.matrixWorld)
      const dist = world.distanceTo(pointerWorld)
      const near = THREE.MathUtils.clamp(1 - dist / 6, 0, 1)
      const isSelected = selected === i
      const pulse = Math.sin(t * 2 + i) * 0.008

      dummy.position.copy(p)
      dummy.scale.setScalar(0.055 + near * 0.075 + (isSelected ? 0.05 : 0) + pulse)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)

      color.copy(isSelected ? pick : base).lerp(active, near)
      m.setColorAt(i, color)
    })

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={ref}
      args={[null, null, points.length]}
      onClick={(e) => {
        e.stopPropagation()
        if (e.instanceId != null) onSelect(e.instanceId)
      }}
    >
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.35} metalness={0.6} flatShading toneMapped={false} />
    </instancedMesh>
  )
}

function Lattice() {
  const { low } = useMemo(getPerfProfile, [])
  const points = useMemo(() => fibonacciSphere(low ? 42 : 86, 2.15), [low])
  const pairs = useMemo(() => nearestPairs(points, low ? 0.95 : 0.72), [points, low])
  const [selected, setSelected] = useState(null)

  return (
    <DragGroup autoSpin={0.14} parallax={0.9} maxPitch={0.7} hitRadius={3.4}>
      <Edges points={points} pairs={pairs} />
      <Nodes points={points} selected={selected} onSelect={setSelected} />
      <mesh>
        <sphereGeometry args={[1.55, 24, 16]} />
        <meshBasicMaterial color={PALETTE.carbon} transparent opacity={0.55} />
      </mesh>
    </DragGroup>
  )
}

export default function NetworkScene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 6]} intensity={0.9} color={PALETTE.mist} />
      <pointLight position={[-4, 2, 3]} intensity={18} distance={16} color={PALETTE.indigo} />
      <Lattice />
    </>
  )
}
