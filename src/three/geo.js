import * as THREE from 'three'

/**
 * Palet: cyberpunk yang ditahan.
 * Tidak ada magenta/cyan neon jenuh. Basisnya biru-abu dingin,
 * aksen hanya dua: teal teredam + indigo. Cahaya datang dari material,
 * bukan dari warna yang berteriak.
 */
export const PALETTE = {
  void: '#06080b',
  ink: '#0b1016',
  slate: '#1b2530',
  steel: '#48586a',
  mist: '#c8d3de',
  teal: '#3fb8a4',
  indigo: '#5b6cd9'
}

/** PRNG deterministik supaya bentuk acak tetap sama tiap reload. */
export function seededRandom(seed = 1) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Kotak dengan sudut membulat, dibangun dari Shape + ExtrudeGeometry. */
export function roundedBoxGeometry(width, height, depth, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  const w = width / 2 - r
  const h = height / 2 - r
  const shape = new THREE.Shape()
  shape.moveTo(-w - r, -h)
  shape.lineTo(-w - r, h)
  shape.quadraticCurveTo(-w - r, h + r, -w, h + r)
  shape.lineTo(w, h + r)
  shape.quadraticCurveTo(w + r, h + r, w + r, h)
  shape.lineTo(w + r, -h)
  shape.quadraticCurveTo(w + r, -h - r, w, -h - r)
  shape.lineTo(-w, -h - r)
  shape.quadraticCurveTo(-w - r, -h - r, -w - r, -h)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.15,
    bevelSize: depth * 0.15,
    bevelSegments: 2,
    curveSegments: 8
  })
  geo.center()
  return geo
}

/** Titik-titik terdistribusi merata di bola (Fibonacci sphere). */
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
