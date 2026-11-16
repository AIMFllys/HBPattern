'use client'

import { Icon } from '@/components/icons/Icon'

export function PanelHeader({
  icon,
  title,
  children,
}: {
  icon: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <Icon name={icon} size={16} className="text-gold" />
        <h3 className="truncate text-xs font-bold uppercase tracking-wider text-text">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export function ToggleButton({
  active,
  icon,
  label,
  onClick,
  disabled,
  rotateIcon = false,
}: {
  active: boolean
  icon: string
  label: string
  onClick: () => void
  disabled?: boolean
  rotateIcon?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-40 ${
        active ? 'bg-gold text-white' : 'bg-surface-elevated text-text-muted hover:bg-border'
      }`}
    >
      <Icon name={icon} size={14} className={rotateIcon ? 'rotate-90' : ''} />
      {label}
    </button>
  )
}

export function EmptyPanel({ message }: { message: string }) {
  return (
    <section className="border-t border-border bg-surface-inset p-4 text-center text-sm text-text-faint">
      {message}
    </section>
  )
}
