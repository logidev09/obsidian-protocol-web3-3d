import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, fibonacciSphere, nearestPairs, getPerfProfile } from './geo'

/**
 * SECTION 3 — Mesh jaringan validator.
 * Node menolak kursor (repulsion halus), rusuk digambar ulang tiap frame
 * mengikuti posisi node. Drag untuk memutar seluruh lattice.
 */

const dummy = new THREE.Object3D()
const pointerWorld = new THREE.Vector3()
const tmp = new THREE.Vector3()

function Lattice() {
  const meshRef = useRef()
  const lineRef = useRef()
  const group = useRef()

  const { nodes, pairs, count } = useMemo(() => {
    const { low } = getPerfProfile()
    const n = low ? 40 : 72
    const pts = fibonacciSphere(n, 2.15)
    return { nodes: pts, pairs: nearestPairs(pts, low ? 1.15 : 0.95), count: n }
  }, [])

  const displaced = useMemo(() => nodes.map((p) => p.clone()), [nodes])

  const lineGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pairs.length * 6), 3))
    return g
  }, [pairs])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    // posisi pointer diproyeksikan ke ruang lokal grup
    pointerWorld.set(state.pointer.x * 3.4, state.pointer.y * 2.4, 2.6)
    if (group.current) group.current.worldToLocal(pointerWorld)

    for (let i = 0; i < count; i++) {
      const base = nodes[i]
      const cur = displaced[i]

      tmp.copy(base).sub(pointerWorld)
      const dist = tmp.length()
      const force = Math.max(0, 1 - dist / 1.9)
      tmp.normalize().multiplyScalar(force * 0.65)

      const breathe = 1 + Math.sin(t * 0.7 + i * 0.35) * 0.02

      cur.x = THREE.MathUtils.damp(cur.x, base.x * breathe + tmp.x, 6, dt)
      cur.y = THREE.MathUtils.damp(cur.y, base.y * breathe + tmp.y, 6, dt)
      cur.z = THREE.MathUtils.damp(cur.z, base.z * breathe + tmp.z, 6, dt)

      dummy.position.copy(cur)
      dummy.rotation.set(t * 0.2 + i, t * 0.15 + i, 0)
      dummy.scale.setScalar(0.055 + force * 0.05)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true

    const arr = lineGeometry.attributes.position.array
    for (let k = 0; k < pairs.length; k++) {
      const [a, b] = pairs[k]
      const o = k * 6
      arr[o] = displaced[a].x
      arr[o + 1] = displaced[a].y
      arr[o + 2] = displaced[a].z
      arr[o + 3] = displaced[b].x
      arr[o + 4] = displaced[b].y
      arr[o + 5] = displaced[b].z
    }
    lineGeometry.attributes.position.needsUpdate = true
  })

  return (
    <DragGroup ref={group} autoSpin={0.3} parallax={0.5}>
      <group ref={group}>
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={PALETTE.mist}
            emissive={PALETTE.teal}
            emissiveIntensity={0.35}
            roughness={0.3}
            metalness={0.6}
            flatShading
          />
        </instancedMesh>

        <lineSegments ref={lineRef} geometry={lineGeometry}>
          <lineBasicMaterial color={PALETTE.indigo} transparent opacity={0.28} />
        </lineSegments>

        <mesh>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial
            color={PALETTE.slate}
            emissive={PALETTE.copper}
            emissiveIntensity={0.4}
            roughness={0.25}
            metalness={0.9}
            flatShading
          />
        </mesh>
      </group>
    </DragGroup>
  )
}

export default function NetworkScene() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 6]} intensity={0.95} color={PALETTE.mist} />
      <pointLight position={[-5, 2, -2]} intensity={20} distance={18} color={PALETTE.indigo} />
      <Lattice />
    </>
  )
}
