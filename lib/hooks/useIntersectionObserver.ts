import { useEffect, useRef } from 'react'

export function useIntersectionObserver(
  callback: () => void,
  options?: { threshold?: number; rootMargin?: string }
) {
  const ref = useRef<HTMLDivElement | null>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) callbackRef.current()
      },
      { threshold: options?.threshold ?? 0.1, rootMargin: options?.rootMargin ?? '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [options?.threshold, options?.rootMargin])

  return ref
}
