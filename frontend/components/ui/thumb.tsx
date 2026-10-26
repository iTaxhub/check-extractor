'use client';

import * as React from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A page or cheque thumbnail: shimmer while it loads, a document icon if it
 * can't. Each call site used to hide the <img> on error, which left an empty
 * grey box that looked like a broken upload.
 */
export function Thumb({
  src,
  alt,
  className,
  imgClassName,
  icon,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  icon?: React.ReactNode;
}) {
  const [state, setState] = React.useState<'loading' | 'ok' | 'error'>('loading');
  React.useEffect(() => setState('loading'), [src]);
  return (
    <div className={cn('relative overflow-hidden bg-surface-sunken', className)}>
      {state === 'loading' ? <div className="absolute inset-0 animate-skeleton-sheen bg-gradient-to-r from-transparent via-white/60 to-transparent" aria-hidden /> : null}
      {state === 'error' ? (
        <div className="absolute inset-0 flex items-center justify-center text-ink-faint" aria-hidden>
          {icon ?? <FileText className="h-6 w-6" />}
        </div>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- authenticated API image, not a static asset */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setState('ok')}
        onError={() => setState('error')}
        className={cn('h-full w-full object-contain transition-opacity duration-quick ease-settle', state === 'ok' ? 'opacity-100' : 'opacity-0', imgClassName)}
      />
    </div>
  );
}
