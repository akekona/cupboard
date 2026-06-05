import type { HTMLAttributes, LabelHTMLAttributes } from 'react'

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & { className?: string }
type DivProps   = HTMLAttributes<HTMLDivElement>        & { className?: string }

export function InputLabelText({ className = '', children, ...props }: LabelProps) {
  return (
    <label className={`block text-xs font-medium text-gray-700 mb-1 ${className}`} {...props}>
      {children}
    </label>
  )
}

export function RequiredInputLabelText({ className = '', children, ...props }: LabelProps) {
  return (
    <label className={`block text-xs font-medium text-gray-700 mb-1 ${className}`} {...props}>
      {children} <span className="text-red-500">*</span>
    </label>
  )
}

// Card-level section header — small caps, muted
export function SectionHeaderText({ className = '', children, ...props }: DivProps) {
  return (
    <div className={`text-xs font-semibold text-gray-400 uppercase tracking-wider ${className}`} {...props}>
      {children}
    </div>
  )
}

// Field name in read-only detail views
export function FieldLabelText({ className = '', children, ...props }: DivProps) {
  return (
    <div className={`text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5 ${className}`} {...props}>
      {children}
    </div>
  )
}
