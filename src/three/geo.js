import * as THREE from 'three'

/**
 * Palet — cyberpunk yang sengaja diredam.
 * Basis: batu tulis kebiruan yang sangat gelap.
 * Aksen: teal desaturasi + indigo dingin + amber pucat sebagai nada hangat.
 * Tidak ada magenta neon / hijau menyala — saturasi dijaga di bawah ~60%.
 */
export const PALETTE = {
  void: '#06080b',
  ink: '#0b1016',
  slate: '#1b2530',
  steel: '#38495a',
  mist: '#c3cedb',
  teal: '#4fb3a5',
  indigo: '#5c6fd4',
  amber: '#d6a06a'
}

/** PRNG deterministik supaya layout partikel identik di setiap render/SSR. */
export function seededRandom(seed = 1) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * Profil performa sederhana. Perangkat lemah / prefers-reduced-motion
 * mendapat dpr lebih rendah dan jumlah partikel lebih sedikit,
 * sehingga scroll tetap mulus.
 */
export function getPerfProfile() {
  if (typeof window === 'undefined') {
    return { dpr: [1, 1.5], low: false, reduced: false, particles: 1 }
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const cores = navigator.hardwareConcurrency || 4
  const mobile = window.innerWidth < 820
  const low = reduced || cores <= 4 || mobile
  return {
    reduced,
    low,
    mobile,
    dpr: low ? [1, 1.4] : [1, 2],
    particles: low ? 0.55 : 1
  }
}

/** Kotak dengan sudut membulat, dibangun dari ExtrudeGeometry (tanpa dependensi tambahan). */
export function roundedBoxGeometry(w, h, d, r = 0.08) {
  const radius = Math.min(r, w / 2 - 0.001, d / 2 - 0.001)
  const shape = new THREE.Shape()
  const x = -w / 2
  const z = -d / 2
  shape.moveTo(x + radius, z)
  shape.lineTo(x + w - radius, z)
  shape.quadraticCurveTo(x + w, z, x + w, z + radius)
  shape.lineTo(x + w, z + d - radius)
  shape.quadraticCurveTo(x + w, z + d, x + w - radius, z + d)
  shape.lineTo(x + radius, z + d)
  shape.quadraticCurveTo(x, z + d, x, z + d - radius)
  shape.lineTo(x, z + radius)
  shape.quadraticCurveTo(x, z, x + radius, z)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 2,
    curveSegments: 4
  })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, h / 2, 0)
  geo.computeVertexNormals()
  return geo
}

/** Posisi titik pada bola (Fibonacci sphere) — dipakai node jaringan. */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius)
    )
  }
  return points
}
