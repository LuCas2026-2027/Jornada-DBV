import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-20 h-5 bg-slate-200 rounded-full" />
        <div className="w-14 h-5 bg-slate-200 rounded-full" />
      </div>
      <div className="w-3/4 h-6 bg-slate-200 rounded-xl" />
      <div className="w-1/2 h-4 bg-slate-100 rounded-lg" />
      <div className="h-20 bg-slate-100 rounded-2xl" />
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="w-24 h-4 bg-slate-200 rounded-lg" />
        <div className="w-20 h-8 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-48 rounded-3xl bg-slate-200/80 w-full" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-64 rounded-3xl bg-slate-200/80 w-full" />
          <div className="h-32 rounded-3xl bg-slate-200/80 w-full" />
        </div>
      </div>
    </div>
  );
}
