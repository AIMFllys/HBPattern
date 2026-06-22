'use client'

import { motion } from 'motion/react'

interface ColorPaletteProps {
  colors: string[]
}

export function ColorPalette({ colors }: ColorPaletteProps) {
  if (!colors || colors.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-gold uppercase tracking-widest">色彩色板</h3>
      <div className="flex gap-3 flex-wrap">
        {colors.map((color, i) => (
          <motion.div
            key={`${color}-${i}`}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
            className="flex flex-col items-center gap-2"
          >
            <div
              className="w-16 h-16 rounded-xl shadow-card border border-black/5"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-text-faint font-mono">{color}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ColorPalette
