/** Rig pencahayaan bersama — warna redup, kontras terkontrol (bukan neon norak). */
export default function Lights({ accent = '#3fd8c2', fill = '#7c8cff', intensity = 1 }) {
  return (
    <>
      <ambientLight intensity={0.35 * intensity} color="#8ea0b5" />
      <directionalLight position={[4, 6, 5]} intensity={1.1 * intensity} color="#dfe7f2" />
      <pointLight position={[-4, -2, -3]} intensity={2.2 * intensity} color={fill} distance={16} decay={2} />
      <pointLight position={[3, -1.5, 3]} intensity={1.6 * intensity} color={accent} distance={14} decay={2} />
      <spotLight position={[0, 7, 2]} angle={0.5} penumbra={1} intensity={1.2 * intensity} color="#ffffff" />
    </>
  )
}
