import React from 'react';

interface SkeletonProps {
  className?: string;
}

// General Skeleton
export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => (
  <div className={`${className} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse`} />
);

// Skeleton for KPI Cards
export const SkeletonKPICard: React.FC = () => (
  <div className="bg-white p-6 rounded-lg shadow animate-pulse">
    <Skeleton className="h-4 w-32 mb-3" />
    <Skeleton className="h-10 w-24" />
  </div>
);

// Skeleton for Chart
export const SkeletonChart: React.FC = () => (
  <div className="bg-white rounded-lg shadow space-y-4 animate-pulse">
    <Skeleton className="h-64 w-full rounded" />
  </div>
);

// Skeleton for Table Row
export const SkeletonTableRow: React.FC = () => (
  <tr className="border-b animate-pulse">
    <td className="px-4 py-2"><Skeleton className="h-4 w-16" /></td>
    <td className="px-4 py-2"><Skeleton className="h-4 w-40" /></td>
    <td className="px-4 py-2"><Skeleton className="h-4 w-24" /></td>
    <td className="px-4 py-2"><Skeleton className="h-4 w-20" /></td>
    <td className="px-4 py-2"><Skeleton className="h-4 w-24" /></td>
    <td className="px-4 py-2"><Skeleton className="h-4 w-28" /></td>
  </tr>
);

// Skeleton for Filter Section
export const SkeletonFilterSection: React.FC = () => (
  <div className="bg-white p-6 rounded-lg shadow space-y-4 animate-pulse">
    <Skeleton className="h-6 w-32 mb-4" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-10 w-full rounded" />
      ))}
    </div>
    <div className="flex gap-2 pt-4">
      <Skeleton className="h-10 w-32 rounded" />
      <Skeleton className="h-10 w-24 rounded" />
    </div>
  </div>
);

// Skeleton for Stats Cards Grid
export const SkeletonStatsGrid: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonKPICard key={i} />
    ))}
  </div>
);

// Skeleton for Insights Cards
export const SkeletonInsightsGrid: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-gradient-to-br from-gray-200 to-gray-300 text-white p-6 rounded-lg shadow animate-pulse">
        <Skeleton className="h-4 w-32 mb-3 bg-gray-400" />
        <Skeleton className="h-8 w-20 bg-gray-400" />
      </div>
    ))}
  </div>
);

// Skeleton for Export Section
export const SkeletonExportSection: React.FC = () => (
  <div className="bg-white p-6 rounded-lg shadow space-y-4 animate-pulse">
    <Skeleton className="h-6 w-32 mb-4" />
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-10 w-full rounded" />
      </div>
      <Skeleton className="h-10 w-32 rounded" />
    </div>
  </div>
);

// Skeleton for Full Table
export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white p-6 rounded-lg shadow animate-pulse">
    <Skeleton className="h-6 w-40 mb-4" />
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left px-4 py-2"><Skeleton className="h-4 w-12" /></th>
            <th className="text-left px-4 py-2"><Skeleton className="h-4 w-24" /></th>
            <th className="text-left px-4 py-2"><Skeleton className="h-4 w-16" /></th>
            <th className="text-left px-4 py-2"><Skeleton className="h-4 w-20" /></th>
            <th className="text-left px-4 py-2"><Skeleton className="h-4 w-24" /></th>
            <th className="text-left px-4 py-2"><Skeleton className="h-4 w-28" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Skeleton for Sidebar List
export const SkeletonList: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-lg animate-pulse">
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    ))}
  </div>
);

// Skeleton for Admin Dashboard
export const SkeletonAdminDashboard: React.FC = () => (
  <div className="space-y-12">
    {/* Header */}
    <div className="animate-pulse">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>

    {/* KPI Cards */}
    <SkeletonStatsGrid count={3} />

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <SkeletonChart />
      <SkeletonChart />
    </div>

    {/* Table */}
    <SkeletonTable rows={5} />
  </div>
);
