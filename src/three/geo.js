import * as THREE from 'three'

/**
 * Palet. Sengaja low-saturation: dasar hitam kebiruan, aksen teal teredam
 * dan tembaga hangat. Tidak ada neon magenta / hijau stabilo.
 */
export const PALETTE = {
  void: '#06080b',
  carbon: '#0c1015',
  slate: '#1b232c',
  steel: '#4a5c6b',
  mist: '#c8d2dc',
  teal: '#3e8f8c',
  indigo: '#4a5a8c',
  copper: '#a9714b'
}

/** Titik terdistribusi merata di permukaan bola (spiral Fibonacci). */
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

/** Pasangan titik yang berjarak lebih dekat dari `threshold` (relatif radius). */
export function nearestPairs(points, threshold) {
  const radius = points[0]?.length() || 1
  const limit = threshold * radius
  const pairs = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceTo(points[j]) < limit) pairs.push([i, j])
    }
  }
  return pairs
}

/** Profil performa perangkat: turunkan beban di device lemah. */
export function getPerfProfile() {
  if (typeof window === 'undefined') return { low: false, reducedMotion: false, dpr: [1, 2] }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const cores = navigator.hardwareConcurrency || 4
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 900
  const low = cores <= 4 || (coarse && narrow)

  return { low, reducedMotion, dpr: low ? [1, 1.5] : [1, 2] }
}

export function damp(current, target, lambda, delta) {
  return THREE.MathUtils.damp(current, target, lambda, Math.min(delta, 0.05))
}
