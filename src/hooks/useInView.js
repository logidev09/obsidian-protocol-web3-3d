import { useEffect, useRef, useState } from 'react'

/** Observer ringan: dipakai untuk reveal & untuk mematikan render 3D di luar layar. */
export default function useInView({ threshold = 0.15, once = false, rootMargin = '0px' } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) io.unobserve(el)
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [threshold, once, rootMargin])

  return [ref, inView]
}
