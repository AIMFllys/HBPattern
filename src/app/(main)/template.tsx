'use client'

import { motion } from 'motion/react'
import { pageTransition, defaultTransition } from '@/lib/motion'

export default function MainTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      transition={defaultTransition}
    >
      {children}
    </motion.div>
  )
}
