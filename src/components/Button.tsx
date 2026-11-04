import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center rounded-full px-8 py-3.5 text-[14.5px] font-medium tracking-[0.1em] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/45 disabled:opacity-40 disabled:cursor-not-allowed'

const variants = {
  primary:
    'border border-gold bg-cream/80 text-ink hover:bg-sage/70 hover:border-[#C9A65F] shadow-[0_1px_0_rgba(216,182,111,0.12)]',
  secondary:
    'border border-border bg-cream-soft/80 text-ink hover:border-gold/45 shadow-none',
  ghost:
    'bg-transparent text-ink-muted hover:text-ink hover:bg-sand/50 shadow-none border border-transparent',
}

type Variant = keyof typeof variants

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function ButtonLink({
  to,
  variant = 'primary',
  className = '',
  children,
}: {
  to: string
  variant?: Variant
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  )
}
