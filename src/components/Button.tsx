import { cn } from '@/lib/utils'

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}) {
  return (
    <button
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50',
        variant === 'primary' && 'bg-eopix-600 text-white hover:bg-eopix-700',
        variant === 'secondary' && 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
        variant === 'ghost' && 'text-gray-600 hover:text-gray-900',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
