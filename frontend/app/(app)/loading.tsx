import { GlassCard, Skeleton, SkeletonRows } from '@/components/ui';

/**
 * Shared route-level skeleton for the signed-in app. Next shows it the instant
 * a nav link is clicked (inside the shell, which stays mounted), so a click
 * never sits on the old page waiting for the new one's data.
 *
 * Also used in place by pages that still gate on a first load, so the layout
 * does not jump when data lands.
 */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-5" role="status" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton shape="line" className="w-24" />
        <Skeleton shape="heading" className="w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} shape="block" className="h-20" />
        ))}
      </div>
      <GlassCard padding="none" className="overflow-hidden">
        <SkeletonRows rows={8} cols={5} />
      </GlassCard>
    </div>
  );
}

export default function AppLoading() {
  return <PageSkeleton />;
}
