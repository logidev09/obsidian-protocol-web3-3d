import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDragRotate } from './useDragRotate'

/**
 * NETWORK — lattice node vector: titik-titik terhubung garis,
 * bisa diputar, node membesar & jalur menyala saat hover.
 */
function Lattice({ onNode }) {
  const { gl } = useThree()
  const { state, step } = useDragRotate(gl.domElement, { sensitivity: 0.005 })
  const group = useRef()
  const nodesRef = useRef()
  const [active, setActive] = useState(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const { positions, edges, count } = useMemo(() => {
    const N = 54
    const pts = []
    // distribusi fibonacci sphere → rapi, tidak menumpuk
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = Math.PI * (3 - Math.sqrt(5)) * i
      const jitter = 0.9 + Math.random() * 0.22
      pts.push(
        new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(2.05 * jitter)
      )
    }
    const seg = []
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        if (pts[i].distanceTo(pts[j]) < 1.15) {
          seg.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z)
        }
      }
    }
    return { positions: pts, edges: new Float32Array(seg), count: N }
  }, [])

  const nodeGeo = useMemo(() => new THREE.OctahedronGeometry(0.062, 0), [])

  useFrame((st, dt) => {
    const s = step()
    const t = st.clock.elapsedTime
    const d = Math.min(dt, 0.05)
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        s.ry + t * 0.09 + s.pointer.x * 0.4,
        4,
        d
      )
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        s.rx - s.pointer.y * 0.25,
        4,
        d
      )
    }
    if (nodesRef.current) {
      positions.forEach((p, i) => {
        const pulse = 1 + Math.sin(t * 1.4 + i * 0.6) * 0.18
        const boost = active === i ? 2.6 : 1
        dummy.position.copy(p)
        dummy.rotation.set(t * 0.4 + i, t * 0.3, 0)
        dummy.scale.setScalar(pulse * boost)
        dummy.updateMatrix()
        nodesRef.current.setMatrixAt(i, dummy.matrix)
      })
      nodesRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group ref={group}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#46c8b4" transparent opacity={0.22} />
      </lineSegments>

      <instancedMesh
        ref={nodesRef}
        args={[nodeGeo, undefined, count]}
        onPointerMove={(e) => {
          e.stopPropagation()
          if (e.instanceId != null && e.instanceId !== active) {
            setActive(e.instanceId)
            onNode(e.instanceId)
          }
        }}
        onPointerOut={() => {
          setActive(null)
          onNode(null)
        }}
      >
        <meshStandardMaterial
          color="#cfe0ee"
          flatShading
          metalness={0.6}
          roughness={0.3}
          emissive="#46c8b4"
          emissiveIntensity={0.5}
        />
      </instancedMesh>

      {/* cangkang ikosahedron sebagai batas jaringan */}
      <mesh>
        <icosahedronGeometry args={[2.35, 1]} />
        <meshBasicMaterial color="#7c7ae0" wireframe transparent opacity={0.1} />
      </mesh>
    </group>
  )
}

export default function NetworkLattice({ onNode = () => {} }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 4]} intensity={20} distance={18} color="#9fd8ff" />
      <pointLight position={[-4, -3, -2]} intensity={16} distance={18} color="#7c7ae0" />
      <Lattice onNode={onNode} />
    </>
  )
}
