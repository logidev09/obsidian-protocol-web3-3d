import * as THREE from 'three'

/**
 * Palet warna proyek.
 * Sengaja dijaga low-saturation: dasar biru-abu dingin, aksen teal & amber
 * dipakai tipis sebagai emissive saja. Tidak ada magenta/cyan neon penuh,
 * supaya kesan cyberpunk-nya datang dari kontras dan cahaya, bukan dari
 * warna yang menyala berlebihan.
 */
export const PALETTE = {
  void: '#06080b',
  slate: '#2b3440',
  steel: '#5b6b7d',
  mist: '#c9d4de',
  indigo: '#3d5a80',
  teal: '#5fb3a3',
  amber: '#c98b52'
}

/** PRNG deterministik supaya bentuk acak tetap sama di setiap reload. */
export function seededRandom(seed = 1) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * Kotak dengan sudut ter-bevel, dibangun dari ExtrudeGeometry.
 * Dipakai untuk lapisan perangkat vault — lebih halus daripada BoxGeometry
 * tapi tetap terbaca sebagai polygon.
 */
export function roundedBoxGeometry(width, height, depth, radius = 0.2) {
  const w = width / 2 - radius
  const h = height / 2 - radius
  const shape = new THREE.Shape()
  shape.moveTo(-w, -h - radius)
  shape.lineTo(w, -h - radius)
  shape.quadraticCurveTo(w + radius, -h - radius, w + radius, -h)
  shape.lineTo(w + radius, h)
  shape.quadraticCurveTo(w + radius, h + radius, w, h + radius)
  shape.lineTo(-w, h + radius)
  shape.quadraticCurveTo(-w - radius, h + radius, -w - radius, h)
  shape.lineTo(-w - radius, -h)
  shape.quadraticCurveTo(-w - radius, -h - radius, -w, -h - radius)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 6
  })
  geo.center()
  return geo
}

/** Titik-titik terdistribusi merata di permukaan bola (Fibonacci sphere). */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius)
    )
  }
  return points
}
