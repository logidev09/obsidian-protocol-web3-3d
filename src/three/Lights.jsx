import { PALETTE } from './geo'

/**
 * Pencahayaan tiga titik dengan rim light dingin.
 * Sengaja tanpa HDR environment agar tidak ada request aset eksternal.
 */
export default function Lights({ intensity = 1 }) {
  return (
    <>
      <ambientLight intensity={0.35 * intensity} color={PALETTE.steel} />
      <hemisphereLight
        intensity={0.45 * intensity}
        color={PALETTE.teal}
        groundColor={PALETTE.base}
      />
      <directionalLight
        position={[4, 6, 5]}
        intensity={1.5 * intensity}
        color={PALETTE.ink}
      />
      <pointLight position={[-5, -2, -4]} intensity={22 * intensity} color={PALETTE.indigo} distance={18} />
      <pointLight position={[5, -3, 3]} intensity={14 * intensity} color={PALETTE.teal} distance={16} />
    </>
  )
}
