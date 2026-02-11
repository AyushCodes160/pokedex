import { TYPE_COLORS } from '@/lib/pokemon-types';
import { cn } from '@/lib/utils';

interface TypeBadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold uppercase tracking-wider text-white shadow-md',
        TYPE_COLORS[type] || 'bg-muted',
        sizeClasses[size]
      )}
    >
      {type}
    </span>
  );
}
