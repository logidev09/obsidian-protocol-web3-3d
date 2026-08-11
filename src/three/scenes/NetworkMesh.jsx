import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, fibonacciSphere } from '../geo'

/**
 * Jaringan node: bola node yang saling terhubung.
 * - Node terdekat kursor akan membesar & menyala, propagasi ke tetangganya.
 * - Garis penghubung berdenyut mengikuti node aktif.
 * - Seluruh bola bisa di-drag.
 */

const NODE_COUNT = 42
const RADIUS = 2.1
const LINK_DIST = 1.35

export default function NetworkMesh() {
  const nodes = useMemo(() => fibonacciSphere(NODE_COUNT, RADIUS), [])

  const links = useMemo(() => {
    const pairs = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < LINK_DIST) pairs.push([i, j])
      }
    }
    return pairs
  }, [nodes])

  const lineGeo = useMemo(() => {
    const positions = new Float32Array(links.length * 6)
    links.forEach(([a, b], k) => {
      positions.set([nodes[a].x, nodes[a].y, nodes[a].z], k * 6)
      positions.set([nodes[b].x, nodes[b].y, nodes[b].z], k * 6 + 3)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [links, nodes])

  const instances = useRef()
  const [active, setActive] = useState(-1)
  const { pointer, raycaster, camera } = useThree()

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const worldNode = useMemo(() => new THREE.Vector3(), [])
  const scales = useRef(new Float32Array(NODE_COUNT).fill(1))

  useFrame((state, delta) => {
    const mesh = instances.current
    if (!mesh) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    // cari node terdekat ke sinar kursor (murah: proyeksi jarak titik-ke-sinar)
    raycaster.setFromCamera(pointer, camera)
    let best = -1
    let bestDist = 0.6
    for (let i = 0; i < NODE_COUNT; i++) {
      worldNode.copy(nodes[i]).applyMatrix4(mesh.matrixWorld)
      const d = raycaster.ray.distanceToPoint(worldNode)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    if (best !== active) setActive(best)

    for (let i = 0; i < NODE_COUNT; i++) {
      const isActive = i === best
      const neighbour =
        best >= 0 && nodes[i].distanceTo(nodes[best]) < LINK_DIST && !isActive

      const target = isActive ? 2.5 : neighbour ? 1.7 : 1
      scales.current[i] = THREE.MathUtils.damp(scales.current[i], target, 8, dt)

      const pulse = 1 + Math.sin(t * 1.5 + i * 0.7) * 0.06
      dummy.position.copy(nodes[i])
      dummy.scale.setScalar(scales.current[i] * pulse)
      dummy.rotation.set(t * 0.2 + i, t * 0.15 + i, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      const mix = THREE.MathUtils.clamp((scales.current[i] - 1) / 1.5, 0, 1)
      color.set(PALETTE.steel).lerp(new THREE.Color(PALETTE.teal), mix)
      mesh.setColorAt(i, color)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} color={PALETTE.mist} />
      <pointLight position={[-3, -2, 2]} intensity={5} color={PALETTE.indigo} distance={9} />

      <DragGroup autoSpin={0.6} parallax={0.7}>
        <instancedMesh ref={instances} args={[undefined, undefined, NODE_COUNT]}>
          <octahedronGeometry args={[0.075, 0]} />
          <meshStandardMaterial
            roughness={0.3}
            metalness={0.9}
            emissive={PALETTE.teal}
            emissiveIntensity={0.3}
            flatShading
          />
        </instancedMesh>

        <lineSegments geometry={lineGeo}>
          <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.22} />
        </lineSegments>

        <mesh>
          <icosahedronGeometry args={[RADIUS * 0.97, 1]} />
          <meshBasicMaterial color={PALETTE.indigo} wireframe transparent opacity={0.07} />
        </mesh>
      </DragGroup>
    </>
  )
}
