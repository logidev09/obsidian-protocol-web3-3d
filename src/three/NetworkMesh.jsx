import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { seededNodes, nearestSegments, PALETTE } from './geo'

/**
 * Mesh jaringan node: titik-titik validator yang saling terhubung.
 * Node bereaksi terhadap posisi pointer — makin dekat, makin terang dan besar.
 */
function Nodes({ points }) {
  const inst = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const cold = useMemo(() => new THREE.Color(PALETTE.steel), [])
  const warm = useMemo(() => new THREE.Color(PALETTE.teal), [])

  useFrame(({ clock, raycaster, pointer, camera }) => {
    const mesh = inst.current
    if (!mesh) return

    raycaster.setFromCamera(pointer, camera)
    if (!raycaster.ray.intersectPlane(plane, hit)) hit.set(999, 999, 999)

    const t = clock.getElapsedTime()

    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      const wob = Math.sin(t * 0.8 + i * 0.7) * 0.03
      dummy.position.set(p.x, p.y + wob, p.z)

      const d = Math.hypot(p.x - hit.x, p.y - hit.y)
      const near = Math.max(0, 1 - d / 1.25)
      const s = 0.038 + near * 0.075

      dummy.scale.setScalar(s)
      dummy.rotation.set(t * 0.4 + i, t * 0.3, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      color.copy(cold).lerp(warm, near)
      mesh.setColorAt(i, color)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={inst} args={[null, null, points.length]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial flatShading metalness={0.6} roughness={0.35} toneMapped={false} />
    </instancedMesh>
  )
}

function Links({ points }) {
  const geo = useMemo(() => {
    const segs = nearestSegments(points, 1.05, 3)
    return new THREE.BufferGeometry().setFromPoints(segs)
  }, [points])

  const mat = useRef()
  useFrame(({ clock }) => {
    if (mat.current) {
      mat.current.opacity = 0.16 + Math.sin(clock.getElapsedTime() * 1.1) * 0.05
    }
  })

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial ref={mat} color={PALETTE.indigo} transparent opacity={0.18} />
    </lineSegments>
  )
}

function Pulse({ points }) {
  const ref = useRef()
  const path = useMemo(() => {
    const picks = [4, 17, 29, 41, 8, 23]
      .map((i) => points[i % points.length])
      .filter(Boolean)
    return new THREE.CatmullRomCurve3(picks, true)
  }, [points])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.getElapsedTime() * 0.09) % 1
    ref.current.position.copy(path.getPointAt(t))
  })

  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.075, 0]} />
      <meshBasicMaterial color={PALETTE.sand} toneMapped={false} />
    </mesh>
  )
}

export default function NetworkMesh() {
  const points = useMemo(() => seededNodes(58, 1.85, 11), [])

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} />
      <pointLight position={[-3, 2, 4]} intensity={14} distance={12} color={PALETTE.indigo} />

      <DragGroup autoSpin={0.11} parallax={0.1} sensitivity={0.005}>
        <Nodes points={points} />
        <Links points={points} />
        <Pulse points={points} />

        <mesh>
          <icosahedronGeometry args={[2.35, 1]} />
          <meshBasicMaterial color="#3a4356" wireframe transparent opacity={0.1} />
        </mesh>
      </DragGroup>
    </>
  )
}
