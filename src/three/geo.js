import * as THREE from 'three'

/**
 * Palet: cyberpunk yang ditahan.
 * Dasarnya abu-arang netral; aksen (teal / indigo / copper) sengaja
 * didesaturasi supaya tidak menyala norak. Aksen hanya muncul sebagai
 * emissive tipis dan garis, bukan sebagai bidang besar.
 */
export const PALETTE = {
  void: '#06080b',
  carbon: '#0d1117',
  slate: '#1a2330',
  steel: '#2b3745',
  mist: '#b8c2cc',
  teal: '#4fb3a3',
  indigo: '#6b7bd6',
  copper: '#c08457'
}

/** Profil perangkat - dipakai menurunkan jumlah polygon & DPR di HP. */
export function getPerfProfile() {
  if (typeof window === 'undefined') return { low: false, reduced: false, dpr: [1, 1.5] }

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 820
  const cores = navigator.hardwareConcurrency || 4
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const low = coarse || narrow || cores <= 4

  return {
    low,
    reduced,
    dpr: low ? [1, 1.35] : [1, Math.min(window.devicePixelRatio || 1, 1.85)]
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

/** Pasangan titik berjarak < maxDist - dipakai menggambar rusuk lattice. */
export function nearestPairs(points, maxDist) {
  const pairs = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceTo(points[j]) < maxDist) pairs.push([i, j])
    }
  }
  return pairs
}

/** Icosahedron dengan vertex digeser - wajahnya jadi terasa dipahat. */
export function facetedGeometry(radius = 1, detail = 1, amount = 0.16, seed = 1) {
  const geo = new THREE.IcosahedronGeometry(radius, detail)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = Math.sin(v.x * 2.7 * seed) * Math.cos(v.y * 3.1 * seed) * Math.sin(v.z * 2.3 * seed)
    v.multiplyScalar(1 + n * amount)
    pos.setXYZ(i, v.x, v.y, v.z)
  }

  geo.computeVertexNormals()
  return geo
}
