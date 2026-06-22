import type { ReactNode } from 'react'

export function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label>
      <span className="mb-1 block text-[11px] font-bold text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-border bg-surface px-2 py-2 text-sm outline-none transition focus:border-cinnabar"
      >
        {children}
      </select>
    </label>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="mb-1 block text-[11px] font-bold text-text-muted">{label}</span>
      {children}
    </label>
  )
}
