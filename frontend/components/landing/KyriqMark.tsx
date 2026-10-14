/**
 * The Kyriq mark, in one place. Every variant is a file in public/brand/,
 * cut from the designer's logo pack (SVG versions 1, 6, 7, 9 and 12).
 */
/* eslint-disable @next/next/no-img-element -- static SVGs, nothing for next/image to optimise */
import { cn } from '@/lib/utils';

type MarkProps = { size?: number; className?: string };
type LogoVariant = 'color' | 'white' | 'on-brand';

/** App-icon tile: deep indigo square, white K with the emerald tick. Reads on any surface. */
export function KyriqIcon({ size = 36, className }: MarkProps) {
  return <img src="/brand/kyriq-app-icon.svg" width={size} height={size} alt="" aria-hidden className={cn('shrink-0', className)} />;
}

/** Bare mark for dark surfaces: white K, emerald tick, no tile. */
export function KyriqIconWhite({ size = 22, className }: MarkProps) {
  return <img src="/brand/kyriq-icon-on-brand.svg" width={size} height={size} alt="" aria-hidden className={cn('shrink-0', className)} />;
}

/** Bare symbol for places where the square app tile would be too heavy. */
export function KyriqSymbol({ size = 22, className, variant = 'color' }: MarkProps & { variant?: LogoVariant }) {
  const src = variant === 'color' ? '/brand/kyriq-icon.svg' : variant === 'white' ? '/brand/kyriq-icon-white.svg' : '/brand/kyriq-icon-on-brand.svg';
  return <img src={src} width={size} height={size} alt="" aria-hidden className={cn('shrink-0', className)} />;
}

/** Full lockup. `height` drives size; the artwork is 2.43:1. */
export function KyriqLogo({ height = 32, variant = 'color', className }: { height?: number; variant?: LogoVariant; className?: string }) {
  const src = variant === 'color' ? '/brand/kyriq-logo.svg' : variant === 'white' ? '/brand/kyriq-logo-white.svg' : '/brand/kyriq-logo-on-brand.svg';
  return <img src={src} height={height} width={Math.round(height * 2.43)} alt="Kyriq" className={cn('shrink-0', className)} />;
}
