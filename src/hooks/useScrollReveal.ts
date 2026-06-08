import { useInView } from 'motion/react'
import { useRef } from 'react'

export function useScrollReveal(options = {}) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true,
    margin: '-50px',
    ...options,
  })

  return { ref, isInView }
}
