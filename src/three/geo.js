import * as THREE from 'three'

/**
 * Palet "muted cyberpunk": gelap, dingin, kontras rendah.
 * Aksen sengaja de-saturated (teal keabuan + copper) supaya tidak norak
 * seperti neon magenta/cyan yang biasa dipakai template crypto.
 */
export const PALETTE = {
  void: '#06080b',
  ink: '#0b0f14',
  carbon: '#111823',
  slate: '#1b2430',
  steel: '#46586b',
  mist: '#c9d4de',
  teal: '#3aa294',
  indigo: '#4b5d94',
  copper: '#b8794b'
}

/** Deteksi perangkat lemah -> semua scene menurunkan jumlah polygon. */
export function getPerfProfile() {
  if (typeof window === 'undefined') return { low: false, dpr: [1, 1.5] }
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const cores = navigator.hardwareConcurrency ?? 8
  const narrow = window.innerWidth < 820
  const low = narrow || cores <= 4
  return { low, reduced, dpr: low ? [1, 1.4] : [1, 1.8] }
}

/** Sebaran titik merata di permukaan bola (spiral Fibonacci). */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    points.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius))
  }
  return points
}

/** Pasangan titik yang berjarak < threshold -> dipakai jadi rusuk lattice. */
export function nearestPairs(points, threshold) {
  const pairs = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceTo(points[j]) < threshold) pairs.push([i, j])
    }
  }
  return pairs
}

/** Titik acak di dalam kubus, dipakai untuk partikel debu. */
export function randomInBox(count, spread) {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count * 3; i++) arr[i] = (Math.random() - 0.5) * spread
  return arr
}
