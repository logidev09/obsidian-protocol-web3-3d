import * as THREE from 'three'

/**
 * Palet "muted cyberpunk": gelap, dingin, kontras rendah antar aksen.
 * Tidak ada neon jenuh (magenta/hijau stabilo) — aksen dijaga di
 * saturasi menengah supaya tetap futuristik tanpa terlihat norak.
 */
export const PALETTE = {
  base: '#06080b',
  surface: '#0b1016',
  line: '#1b242e',
  ink: '#e6edf3',
  dim: '#8493a2',
  teal: '#5ccfc4',
  indigo: '#7b74e8',
  amber: '#cfa15e',
  steel: '#48606f'
}

export const C = Object.fromEntries(
  Object.entries(PALETTE).map(([k, v]) => [k, new THREE.Color(v)])
)

/** PRNG deterministik supaya komposisi acak selalu sama tiap load. */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Sebaran titik merata di permukaan bola (spiral Fibonacci). */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
    )
  }
  return points
}

/** Pasangan node terdekat, dipakai untuk menggambar rusuk jaringan. */
export function nearestPairs(points, maxDistance) {
  const pairs = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceTo(points[j]) < maxDistance) pairs.push([i, j])
    }
  }
  return pairs
}

export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

/**
 * Profil performa perangkat. Dipakai untuk menurunkan resolusi render dan
 * jumlah objek di laptop lama / ponsel, supaya scroll tetap mulus.
 */
export function getPerfProfile() {
  if (typeof window === 'undefined') {
    return { dpr: 1, low: true, density: 0.6, reduced: false }
  }
  const cores = navigator.hardwareConcurrency || 4
  const narrow = window.innerWidth < 820
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const low = cores <= 4 || narrow
  return {
    dpr: low ? [1, 1.4] : [1, 1.9],
    low,
    reduced,
    density: low ? 0.55 : 1
  }
}
