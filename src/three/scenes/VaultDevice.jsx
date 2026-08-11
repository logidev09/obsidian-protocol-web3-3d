import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, roundedBoxGeometry } from '../geo'

const LAYERS = [
  { id: 'shell', label: 'Titanium shell', y: 0.34, color: PALETTE.slate, emissive: PALETTE.steel },
  { id: 'screen', label: 'Sapphire display', y: 0.17, color: PALETTE.ink, emissive: PALETTE.teal },
  { id: 'secure', label: 'Secure element', y: 0.0, color: PALETTE.steel, emissive: PALETTE.indigo },
  { id: 'battery', label: 'Solid-state cell', y: -0.17, color: PALETTE.slate, emissive: PALETTE.amber },
  { id: 'base', label: 'Machined base', y: -0.34, color: PALETTE.ink, emissive: PALETTE.steel }
]

/**
 * Perangkat vault — lima lapis yang bisa "dibongkar".
 * Drag untuk memutar; klik perangkat untuk memisahkan lapisan (exploded view);
 * hover pada satu lapisan menyorotnya dan melaporkan namanya ke UI di luar canvas.
 */
export default function VaultDevice({ onLayerChange }) {
  const [exploded, setExploded] = useState(false)
  const [hover, setHover] = useState(null)
  const spread = useRef(0)
  const refs = useRef([])
  const glow = useRef()

  const geo = useMemo(() => roundedBoxGeometry(1.5, 0.14, 2.5, 0.28), [])
  const secureGeo = useMemo(() => roundedBoxGeometry(0.9, 0.1, 0.9, 0.16), [])

  useEffect(() => {
    onLayerChange?.(hover)
  }, [hover, onLayerChange])

  useEffect(() => () => {
    geo.dispose()
    secureGeo.dispose()
  }, [geo, secureGeo])

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = clock.elapsedTime
    spread.current = THREE.MathUtils.damp(spread.current, exploded ? 1 : 0, 5, dt)

    LAYERS.forEach((layer, i) => {
      const mesh = refs.current[i]
      if (!mesh) return
      const lift = layer.y * (1 + spread.current * 2.6)
      const isHot = hover === layer.id
      mesh.position.y = THREE.MathUtils.damp(mesh.position.y, lift, 8, dt)
      mesh.position.x = THREE.MathUtils.damp(mesh.position.x, isHot ? 0.14 : 0, 8, dt)
      const targetScale = isHot ? 1.03 : 1
      const s = THREE.MathUtils.damp(mesh.scale.x, targetScale, 8, dt)
      mesh.scale.setScalar(s)
      mesh.material.emissiveIntensity = THREE.MathUtils.damp(
        mesh.material.emissiveIntensity,
        isHot ? 0.9 : 0.22 + spread.current * 0.15,
        6,
        dt
      )
    })

    if (glow.current) {
      glow.current.material.opacity = 0.12 + Math.sin(t * 1.4) * 0.03 + spread.current * 0.1
      glow.current.rotation.y = t * 0.12
    }
  })

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 6, 4]} intensity={1.5} color={PALETTE.mist} />
      <pointLight position={[-3, 1, 3]} intensity={10} color={PALETTE.teal} distance={12} />
      <pointLight position={[3, -2, -2]} intensity={8} color={PALETTE.indigo} distance={12} />

      <DragGroup autoSpin={0.24} parallax={0.75} scale={1.05}>
        <group
          onClick={(e) => {
            e.stopPropagation()
            setExploded((v) => !v)
          }}
          onPointerOut={() => setHover(null)}
        >
          {LAYERS.map((layer, i) => (
            <mesh
              key={layer.id}
              ref={(el) => (refs.current[i] = el)}
              geometry={layer.id === 'secure' ? secureGeo : geo}
              position={[0, layer.y, 0]}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHover(layer.id)
              }}
            >
              <meshStandardMaterial
                color={layer.color}
                emissive={layer.emissive}
                emissiveIntensity={0.22}
                metalness={0.9}
                roughness={layer.id === 'screen' ? 0.12 : 0.36}
                flatShading={layer.id === 'secure'}
              />
            </mesh>
          ))}

          <mesh position={[0, 0.245, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.16, 2.0]} />
            <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.07} />
          </mesh>
        </group>

        <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
          <ringGeometry args={[1.5, 2.4, 6]} />
          <meshBasicMaterial color={PALETTE.indigo} transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      </DragGroup>
    </>
  )
}

export { LAYERS }
