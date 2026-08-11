import * as THREE from 'three'

/**
 * Palet — cyberpunk yang "diredam".
 * Aturannya: base gelap kebiruan netral, aksen hanya 2 (teal dingin + indigo),
 * plus sand hangat sebagai penyeimbang. Tidak ada magenta/cyan neon penuh.
 */
export const PALETTE = {
  void: '#06080b',
  ink: '#0d1218',
  slate: '#151d26',
  steel: '#2b3947',
  mist: '#8fa3b8',
  teal: '#4fd1c5',
  indigo: '#6b7cff',
  violet: '#8b7bd8',
  sand: '#d9c9a3'
}

/** Kotak bersudut tumpul low-poly, dipakai bodi perangkat. */
export function roundedBoxGeometry(w, h, d, r = 0.2, segments = 3) {
  const shape = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  const radius = Math.min(r, w / 2, h / 2)

  shape.moveTo(x + radius, y)
  shape.lineTo(x + w - radius, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + radius)
  shape.lineTo(x + w, y + h - radius)
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  shape.lineTo(x + radius, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - radius)
  shape.lineTo(x, y + radius)
  shape.quadraticCurveTo(x, y, x + radius, y)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
    curveSegments: segments
  })
  geo.center()
  geo.computeVertexNormals()
  return geo
}

/** Deret angka pseudo-acak yang stabil antar-render. */
export function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Titik-titik pada bola Fibonacci — dipakai simpul jaringan. */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = phi * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius)
    )
  }
  return points
}
