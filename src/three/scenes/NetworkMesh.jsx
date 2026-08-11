import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, fibonacciSphere, getPerfProfile, seededRandom } from '../geo'

const perf = getPerfProfile()

/**
 * Mesh jaringan — node validator pada bola, dihubungkan garis.
 * Hover pada sebuah node akan "menyalakan" node itu dan tetangganya;
 * paket data bergerak sepanjang tautan secara berkala.
 */
export default function NetworkMesh() {
  const count = Math.round(46 * perf.particles)
  const [active, setActive] = useState(null)
  const nodesRef = useRef()
  const pulseRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])

  const { points, links, packets } = useMemo(() => {
    const pts = fibonacciSphere(count, 2.15)
    const rand = seededRandom(23)
    const lk = []
    pts.forEach((p, i) => {
      const near = pts
        .map((q, j) => ({ j, d: p.distanceTo(q) }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2)
      near.forEach((n) => {
        const key = i < n.j ? `${i}-${n.j}` : `${n.j}-${i}`
        if (!lk.some((l) => l.key === key)) lk.push({ key, a: i, b: n.j })
      })
    })
    const pk = Array.from({ length: perf.low ? 6 : 12 }, () => ({
      link: Math.floor(rand() * lk.length),
      t: rand(),
      speed: 0.22 + rand() * 0.35
    }))
    return { points: pts, links: lk, packets: pk }
  }, [count])

  const linkGeometry = useMemo(() => {
    const positions = new Float32Array(links.length * 6)
    links.forEach((l, i) => {
      const a = points[l.a]
      const b = points[l.b]
      positions.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6)
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [links, points])

  const neighbours = useMemo(() => {
    const map = new Map()
    links.forEach((l) => {
      if (!map.has(l.a)) map.set(l.a, new Set())
      if (!map.has(l.b)) map.set(l.b, new Set())
      map.get(l.a).add(l.b)
      map.get(l.b).add(l.a)
    })
    return map
  }, [links])

  const baseColor = useMemo(() => new THREE.Color(PALETTE.steel), [])
  const hotColor = useMemo(() => new THREE.Color(PALETTE.teal), [])
  const warmColor = useMemo(() => new THREE.Color(PALETTE.amber), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    if (nodesRef.current) {
      const near = active != null ? neighbours.get(active) : null
      points.forEach((p, i) => {
        const isActive = active === i
        const isNear = near?.has(i)
        const pulse = 1 + Math.sin(t * 1.6 + i) * 0.08
        const s = (isActive ? 0.13 : isNear ? 0.095 : 0.062) * pulse
        dummy.position.copy(p)
        dummy.scale.setScalar(s)
        dummy.rotation.set(t * 0.2 + i, t * 0.15, 0)
        dummy.updateMatrix()
        nodesRef.current.setMatrixAt(i, dummy.matrix)
        color.copy(isActive ? warmColor : isNear ? hotColor : baseColor)
        nodesRef.current.setColorAt(i, color)
      })
      nodesRef.current.instanceMatrix.needsUpdate = true
      if (nodesRef.current.instanceColor) nodesRef.current.instanceColor.needsUpdate = true
    }

    if (pulseRef.current) {
      packets.forEach((pk, i) => {
        pk.t += dt * pk.speed
        if (pk.t > 1) {
          pk.t = 0
          pk.link = (pk.link + 7) % links.length
        }
        const l = links[pk.link]
        const a = points[l.a]
        const b = points[l.b]
        dummy.position.lerpVectors(a, b, pk.t)
        const fade = Math.sin(pk.t * Math.PI)
        dummy.scale.setScalar(0.045 * fade + 0.008)
        dummy.rotation.set(t, t * 0.6, 0)
        dummy.updateMatrix()
        pulseRef.current.setMatrixAt(i, dummy.matrix)
      })
      pulseRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 4]} intensity={8} color={PALETTE.mist} distance={16} />
      <pointLight position={[-3, -2, -3]} intensity={6} color={PALETTE.indigo} distance={14} />

      <DragGroup autoSpin={0.22} parallax={0.6}>
        <lineSegments geometry={linkGeometry}>
          <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.28} />
        </lineSegments>

        <instancedMesh
          ref={nodesRef}
          args={[undefined, undefined, count]}
          onPointerMove={(e) => {
            e.stopPropagation()
            setActive(e.instanceId ?? null)
          }}
          onPointerOut={() => setActive(null)}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial metalness={0.85} roughness={0.3} flatShading toneMapped={false} />
        </instancedMesh>

        <instancedMesh ref={pulseRef} args={[undefined, undefined, packets.length]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={PALETTE.amber} toneMapped={false} />
        </instancedMesh>

        <mesh>
          <sphereGeometry args={[2.14, 32, 24]} />
          <meshBasicMaterial color={PALETTE.indigo} wireframe transparent opacity={0.045} />
        </mesh>
      </DragGroup>
    </>
  )
}
