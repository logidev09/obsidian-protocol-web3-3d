import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDragRotate } from './useDragRotate'

/**
 * HERO — "The Core": inti polihedral low-poly + shell wireframe + cincin orbit
 * + serpihan yang mengorbit. Bisa di-drag, mengikuti mouse, dan bereaksi saat hover.
 */
function Core({ accent = '#46c8b4', violet = '#7c7ae0' }) {
  const { gl } = useThree()
  const { state, step, dragging } = useDragRotate(gl.domElement)

  const group = useRef()
  const shell = useRef()
  const inner = useRef()
  const ringA = useRef()
  const ringB = useRef()
  const ringC = useRef()
  const shards = useRef()
  const [hovered, setHovered] = useState(false)

  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(1.28, 1), [])
  const shellGeo = useMemo(() => new THREE.IcosahedronGeometry(1.95, 1), [])
  const shardGeo = useMemo(() => new THREE.TetrahedronGeometry(0.085, 0), [])

  const shardData = useMemo(() => {
    const arr = []
    for (let i = 0; i < 46; i++) {
      arr.push({
        radius: 2.4 + Math.random() * 1.5,
        speed: 0.06 + Math.random() * 0.16,
        phase: Math.random() * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 1.25,
        y: (Math.random() - 0.5) * 2.4,
        spin: Math.random() * 2
      })
    }
    return arr
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((st, dt) => {
    const s = step()
    const t = st.clock.elapsedTime
    const d = Math.min(dt, 0.05)

    if (group.current) {
      // idle spin + drag + subtle pointer follow
      const targetY = s.ry + t * 0.075 + s.pointer.x * 0.28
      const targetX = s.rx + Math.sin(t * 0.35) * 0.06 - s.pointer.y * 0.2
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 4, d)
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 4, d)
      group.current.position.y = Math.sin(t * 0.6) * 0.07
    }

    if (inner.current) {
      const target = hovered || dragging ? 1.09 : 1
      const sc = THREE.MathUtils.damp(inner.current.scale.x, target, 6, d)
      inner.current.scale.setScalar(sc)
      inner.current.material.emissiveIntensity = THREE.MathUtils.damp(
        inner.current.material.emissiveIntensity,
        hovered || dragging ? 0.85 : 0.32,
        5,
        d
      )
    }

    if (shell.current) {
      shell.current.rotation.y = -t * 0.13
      shell.current.rotation.z = t * 0.05
      shell.current.material.opacity = THREE.MathUtils.damp(
        shell.current.material.opacity,
        hovered || dragging ? 0.5 : 0.24,
        5,
        d
      )
    }

    if (ringA.current) ringA.current.rotation.z = t * 0.22
    if (ringB.current) {
      ringB.current.rotation.x = Math.PI / 2.6 + Math.sin(t * 0.3) * 0.1
      ringB.current.rotation.y = -t * 0.18
    }
    if (ringC.current) {
      ringC.current.rotation.y = t * 0.14
      ringC.current.rotation.x = -Math.PI / 3
    }

    if (shards.current) {
      shardData.forEach((sd, i) => {
        const a = sd.phase + t * sd.speed
        dummy.position.set(
          Math.cos(a) * sd.radius,
          sd.y + Math.sin(a * 1.6) * 0.28,
          Math.sin(a) * sd.radius * Math.cos(sd.tilt)
        )
        dummy.rotation.set(a * sd.spin, a * 0.7, a * 0.4)
        dummy.updateMatrix()
        shards.current.setMatrixAt(i, dummy.matrix)
      })
      shards.current.instanceMatrix.needsUpdate = true
      shards.current.rotation.y = t * 0.03
    }
  })

  return (
    <group ref={group}>
      {/* inti solid low-poly */}
      <mesh
        ref={inner}
        geometry={coreGeo}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <meshStandardMaterial
          color="#131a22"
          flatShading
          metalness={0.92}
          roughness={0.28}
          emissive={accent}
          emissiveIntensity={0.32}
        />
      </mesh>

      {/* rangka inti */}
      <lineSegments geometry={coreGeo}>
        <edgesGeometry args={[coreGeo]} attach="geometry" />
        <lineBasicMaterial color={accent} transparent opacity={0.55} />
      </lineSegments>

      {/* shell wireframe luar */}
      <mesh ref={shell} geometry={shellGeo}>
        <meshBasicMaterial color={violet} wireframe transparent opacity={0.24} />
      </mesh>

      {/* cincin orbit polygonal (segmen rendah = terasa "vector") */}
      <mesh ref={ringA}>
        <torusGeometry args={[2.55, 0.006, 3, 96]} />
        <meshBasicMaterial color={accent} transparent opacity={0.42} />
      </mesh>
      <mesh ref={ringB}>
        <torusGeometry args={[3.05, 0.005, 3, 72]} />
        <meshBasicMaterial color={violet} transparent opacity={0.3} />
      </mesh>
      <mesh ref={ringC}>
        <torusGeometry args={[3.55, 0.004, 3, 48]} />
        <meshBasicMaterial color="#c9974c" transparent opacity={0.2} />
      </mesh>

      {/* serpihan orbit */}
      <instancedMesh ref={shards} args={[shardGeo, undefined, shardData.length]}>
        <meshStandardMaterial
          color="#8ea3b5"
          flatShading
          metalness={0.7}
          roughness={0.35}
          emissive={accent}
          emissiveIntensity={0.22}
        />
      </instancedMesh>
    </group>
  )
}

export default function HeroArtifact() {
  return (
    <>
      <ambientLight intensity={0.28} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#cfe6ff" />
      <pointLight position={[-5, -2, 3]} intensity={22} distance={16} color="#46c8b4" />
      <pointLight position={[5, 3, -4]} intensity={18} distance={16} color="#7c7ae0" />
      <Core />
    </>
  )
}
