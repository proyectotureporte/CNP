import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const toneClasses = {
  blue: 'bg-[#1b5697] text-white hover:bg-[#16487f] focus-visible:ring-[#2969b0]',
  green: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
  red: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  slate: 'bg-slate-700 text-white hover:bg-slate-800 focus-visible:ring-slate-500',
};

interface ActionPillButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  icon?: ReactNode;
  tone?: keyof typeof toneClasses;
}

export function ActionPillButton({
  label,
  icon,
  tone = 'blue',
  className,
  ...props
}: ActionPillButtonProps) {
  return (
    <button
      {...props}
      aria-label={label}
      className={cn(
        'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm outline-none transition-[background-color,transform,box-shadow] duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100',
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
