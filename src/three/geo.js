import * as THREE from 'three'

/**
 * Palet.
 *
 * Cyberpunk tanpa norak: dasar biru-abu sangat gelap, aksen desaturasi
 * (teal keabuan, indigo lembut, amber pucat). Tidak ada magenta/hijau neon
 * jenuh — saturasi ditahan di bawah ~55% supaya terbaca mahal, bukan arcade.
 */
export const PALETTE = {
  ink: '#06080b',
  slate: '#161c24',
  steel: '#2e3a45',
  mist: '#c3ccd6',
  teal: '#4fd2c2',
  indigo: '#6b7dd6',
  amber: '#d8a15a'
}

/** Kualitas render menyesuaikan perangkat — dipanggil sekali, hasilnya dipakai semua scene. */
let cached = null
export function getPerfProfile() {
  if (cached) return cached
  if (typeof window === 'undefined') {
    cached = { dpr: [1, 1.5], particles: 1, low: false, reduced: false }
    return cached
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const cores = navigator.hardwareConcurrency || 4
  const narrow = window.innerWidth < 820
  const low = narrow || cores <= 4
  cached = {
    dpr: low ? [1, 1.4] : [1, 1.9],
    particles: low ? 0.5 : 1,
    low,
    reduced
  }
  return cached
}

/** PRNG deterministik — layout partikel identik di tiap reload. */
export function seededRandom(seed = 1) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

/**
 * Balok bersudut tumpul, dibangun dari extrude Shape.
 * Dipakai untuk badan perangkat — memberi siluet CNC tanpa perlu file model.
 */
export function roundedBoxGeometry(width, height, depth, radius) {
  const w = width / 2
  const d = depth / 2
  const r = Math.min(radius, w, d)
  const shape = new THREE.Shape()
  shape.moveTo(-w + r, -d)
  shape.lineTo(w - r, -d)
  shape.quadraticCurveTo(w, -d, w, -d + r)
  shape.lineTo(w, d - r)
  shape.quadraticCurveTo(w, d, w - r, d)
  shape.lineTo(-w + r, d)
  shape.quadraticCurveTo(-w, d, -w, d - r)
  shape.lineTo(-w, -d + r)
  shape.quadraticCurveTo(-w, -d, -w + r, -d)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: height * 0.18,
    bevelSize: height * 0.16,
    bevelSegments: 2,
    curveSegments: 6
  })
  geo.rotateX(-Math.PI / 2)
  geo.center()
  return geo
}

/** Titik-titik pada bola (distribusi Fibonacci) — dasar mesh jaringan. */
export function fibonacciSphere(count, radius = 1) {
  const pts = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    pts.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius))
  }
  return pts
}
