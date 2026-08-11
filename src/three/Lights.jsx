export default function Lights({
  key0 = '#8a9bff',
  key1 = '#3fd0c9',
  ambient = 0.55,
  intensity = 1.1
}) {
  return (
    <>
      <ambientLight intensity={ambient} color="#9aa6c8" />
      <directionalLight position={[4, 6, 5]} intensity={intensity} color={key0} />
      <directionalLight position={[-5, -2, -4]} intensity={intensity * 0.55} color={key1} />
      <pointLight position={[0, -4, 3]} intensity={0.6} color="#4a5578" />
    </>
  )
}
