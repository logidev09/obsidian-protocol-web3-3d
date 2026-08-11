import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, arcBetween, fibonacciSphere } from '../geo'

/**
 * JARINGAN — globe validator low-poly.
 * Node tersebar merata, busur menyala bergiliran seperti paket data.
 */
function Globe() {
  const nodes = useMemo(() => fibonacciSphere(90, 2.1), [])

  const nodeGeo = useMemo(() => new THREE.IcosahedronGeometry(0.05, 0), [])
  const nodeMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: PALETTE.slate, transparent: true, opacity: 0.85 }),
    []
  )

  const instances = useRef()

  const arcs = useMemo(() => {
    const list = []
    for (let i = 0; i < 26; i++) {
      const a = nodes[(i * 7) % nodes.length]
      const b = nodes[(i * 23 + 11) % nodes.length]
      list.push({
        points: arcBetween(a, b, 0.3, 28),
        phase: Math.random() * Math.PI * 2,
        color: i % 3 === 0 ? PALETTE.sand : i % 3 === 1 ? PALETTE.teal : PALETTE.indigo
      })
    }
    return list
  }, [nodes])

  const arcRefs = useRef([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const dummy = new THREE.Object3D()
    nodes.forEach((p, i) => {
      const pulse = 1 + Math.sin(t * 1.6 + i * 0.7) * 0.35
      dummy.position.copy(p)
      dummy.scale.setScalar(pulse)
      dummy.updateMatrix()
      instances.current.setMatrixAt(i, dummy.matrix)
    })
    instances.current.instanceMatrix.needsUpdate = true

    arcRefs.current.forEach((line, i) => {
      if (!line) return
      const a = arcs[i]
      line.material.opacity = 0.12 + (Math.sin(t * 0.9 + a.phase) * 0.5 + 0.5) * 0.5
    })
  })

  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[2.05, 1]} />
        <meshStandardMaterial
          color="#0b1219"
          roughness={0.5}
          metalness={0.6}
          flatShading
          transparent
          opacity={0.9}
        />
      </mesh>

      <mesh>
        <icosahedronGeometry args={[2.06, 2]} />
        <meshBasicMaterial color={PALETTE.indigo} wireframe transparent opacity={0.12} />
      </mesh>

      <instancedMesh ref={instances} args={[nodeGeo, nodeMat, nodes.length]} />

      {arcs.map((arc, i) => {
        const positions = new Float32Array(arc.points.length * 3)
        arc.points.forEach((p, j) => {
          positions[j * 3] = p.x
          positions[j * 3 + 1] = p.y
          positions[j * 3 + 2] = p.z
        })
        return (
          <line key={i} ref={(el) => (arcRefs.current[i] = el)}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={arc.points.length}
                array={positions}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={arc.color} transparent opacity={0.3} />
          </line>
        )
      })}
    </group>
  )
}

export default function NetworkGlobe() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 4, 6]} intensity={1.1} />
      <pointLight position={[-4, 2, -3]} intensity={14} color={PALETTE.violet} distance={16} />
      <DragGroup autoSpin={0.14} parallax={0.16} scale={1.05}>
        <Globe />
      </DragGroup>
    </>
  )
}
