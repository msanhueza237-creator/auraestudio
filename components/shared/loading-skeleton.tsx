'use strict';

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 border border-brand-border rounded-xl space-y-4 shadow-sm animate-pulse">
      <div className="h-4 bg-stone-200 rounded w-1/3" />
      <div className="h-8 bg-stone-300 rounded w-2/3" />
      <div className="h-3 bg-stone-200 rounded w-1/2" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-12 bg-stone-100 border-b border-brand-border flex items-center px-6 space-x-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 bg-stone-200 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-brand-border">
        {[...Array(rows)].map((_, r) => (
          <div key={r} className="h-14 flex items-center px-6 space-x-4">
            {[...Array(4)].map((_, c) => (
              <div key={c} className="h-3 bg-stone-200 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  const heights = ['35%', '65%', '45%', '85%', '55%', '70%', '60%'];
  return (
    <div className="bg-white p-6 border border-brand-border rounded-xl shadow-sm h-80 flex flex-col justify-between animate-pulse">
      <div className="h-4 bg-stone-200 rounded w-1/4" />
      <div className="flex-1 flex items-end justify-between space-x-4 pt-8 pb-4">
        {[...Array(7)].map((_, i) => (
          <div 
            key={i} 
            className="bg-stone-200 rounded-t w-full" 
            style={{ height: heights[i % heights.length] }}
          />
        ))}
      </div>
      <div className="h-3 bg-stone-200 rounded w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Filters Skeleton */}
      <div className="h-16 bg-white border border-brand-border rounded-xl shadow-sm" />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableSkeleton rows={4} />
        <TableSkeleton rows={4} />
      </div>
    </div>
  );
}
