import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDragRotate } from './useDragRotate'

/**
 * TOKEN — keping vector segi-8 yang berputar; drag untuk memutar,
 * hover memicu "charge" pada cincin dalam.
 */
function Coin() {
  const { gl } = useThree()
  const { state, step, dragging } = useDragRotate(gl.domElement, { sensitivity: 0.007 })
  const group = useRef()
  const face = useRef()
  const ring = useRef()
  const spikes = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const coinGeo = useMemo(() => new THREE.CylinderGeometry(1.3, 1.3, 0.22, 8, 1), [])
  const spikeGeo = useMemo(() => new THREE.ConeGeometry(0.07, 0.34, 4), [])
  const SPIKES = 16

  useFrame((st, dt) => {
    const s = step()
    const t = st.clock.elapsedTime
    const d = Math.min(dt, 0.05)
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        s.ry + t * 0.5 + s.pointer.x * 0.3,
        4,
        d
      )
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        s.rx + 0.42 - s.pointer.y * 0.2,
        4,
        d
      )
    }
    if (face.current) {
      face.current.material.emissiveIntensity = THREE.MathUtils.damp(
        face.current.material.emissiveIntensity,
        dragging ? 0.9 : 0.3 + Math.sin(t * 1.5) * 0.08,
        5,
        d
      )
    }
    if (ring.current) ring.current.rotation.z = -t * 0.6
    if (spikes.current) {
      for (let i = 0; i < SPIKES; i++) {
        const a = (i / SPIKES) * Math.PI * 2 + t * 0.25
        const r = 1.62 + Math.sin(t * 2 + i) * 0.05
        dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r)
        dummy.rotation.set(Math.PI / 2, 0, -a)
        dummy.updateMatrix()
        spikes.current.setMatrixAt(i, dummy.matrix)
      }
      spikes.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group ref={group}>
      <mesh ref={face} geometry={coinGeo}>
        <meshStandardMaterial
          color="#161d26"
          flatShading
          metalness={0.95}
          roughness={0.22}
          emissive="#c9974c"
          emissiveIntensity={0.3}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[coinGeo]} attach="geometry" />
        <lineBasicMaterial color="#c9974c" transparent opacity={0.75} />
      </lineSegments>

      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.65, 8]} />
        <meshBasicMaterial color="#46c8b4" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      <instancedMesh ref={spikes} args={[spikeGeo, undefined, SPIKES]}>
        <meshStandardMaterial
          color="#8ea3b5"
          flatShading
          metalness={0.8}
          roughness={0.3}
          emissive="#7c7ae0"
          emissiveIntensity={0.3}
        />
      </instancedMesh>
    </group>
  )
}

export default function TokenCoin() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 5, 3]} intensity={1.2} color="#ffe9c7" />
      <pointLight position={[-4, 0, 3]} intensity={16} distance={14} color="#46c8b4" />
      <pointLight position={[4, 2, -3]} intensity={14} distance={14} color="#7c7ae0" />
      <Coin />
    </>
  )
}
