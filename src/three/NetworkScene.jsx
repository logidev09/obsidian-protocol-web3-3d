import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, fibonacciSphere, getPerfProfile, nearestPairs } from './geo'

/**
 * SECTION 3 - lattice validator.
 * Node tersebar merata di permukaan bola, rusuk digambar antar node terdekat.
 * Node terdekat dengan pointer akan membesar dan menyala (efek "magnet").
 */

function Lattice() {
  const { low } = useMemo(getPerfProfile, [])
  const count = low ? 46 : 88
  const radius = 2.2

  const nodes = useMemo(() => fibonacciSphere(count, radius), [count])
  const edgeGeometry = useMemo(() => {
    const pairs = nearestPairs(nodes, radius * 0.62)
    const positions = new Float32Array(pairs.length * 6)
    pairs.forEach(([a, b], i) => {
      positions.set([nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z], i * 6)
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [nodes, radius])

  const instances = useRef()
  const [hovered, setHovered] = useState(-1)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])

  useFrame((frame) => {
    const mesh = instances.current
    if (!mesh) return
    const t = frame.clock.elapsedTime

    nodes.forEach((p, i) => {
      const wave = Math.sin(t * 1.1 + i * 0.35) * 0.5 + 0.5
      const isHot = i === hovered
      const scale = (isHot ? 0.22 : 0.075) + wave * 0.02
      dummy.position.copy(p)
      dummy.scale.setScalar(scale)
      dummy.rotation.set(t * 0.2 + i, t * 0.15, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      color.set(isHot ? PALETTE.copper : wave > 0.82 ? PALETTE.teal : PALETTE.steel)
      mesh.setColorAt(i, color)
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <DragGroup autoSpin={0.14} parallax={0.8} maxPitch={0.6}>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color={PALETTE.indigo} transparent opacity={0.32} />
      </lineSegments>

      <instancedMesh
        ref={instances}
        args={[null, null, nodes.length]}
        onPointerMove={(e) => {
          e.stopPropagation()
          setHovered(e.instanceId ?? -1)
        }}
        onPointerOut={() => setHovered(-1)}
      >
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.3} metalness={0.85} flatShading />
      </instancedMesh>

      <mesh>
        <sphereGeometry args={[radius * 0.42, 16, 16]} />
        <meshBasicMaterial color={PALETTE.teal} wireframe transparent opacity={0.12} />
      </mesh>
    </DragGroup>
  )
}

export default function NetworkScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 4, 6]} intensity={0.9} color={PALETTE.mist} />
      <pointLight position={[-4, 2, 4]} intensity={20} distance={16} color={PALETTE.indigo} />
      <Lattice />
    </>
  )
}
