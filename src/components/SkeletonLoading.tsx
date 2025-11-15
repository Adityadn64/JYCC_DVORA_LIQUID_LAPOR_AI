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
    <Skeleton className="h-48 w-full rounded" />
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

// Skeleton for a single Report Card
export const SkeletonReportCard: React.FC = () => (
  <div className="bg-white shadow rounded-lg p-5 animate-pulse">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mt-1" />
      </div>
      <div className="mt-4 sm:mt-0 sm:ml-6 text-left sm:text-right flex-shrink-0">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-3 w-28 mt-2" />
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-x-6 gap-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-40" />
    </div>
  </div>
);

export const SkeletonReportDetailPage: React.FC = () => (
  <div className="space-y-8 animate-pulse">
    {/* Header */}
    <div>
      <Skeleton className="h-5 w-24 mb-4" /> {/* Tombol Kembali */}
      <Skeleton className="h-9 w-3/4 md:w-1/2" /> {/* Judul Utama */}
    </div>

    {/* Kartu Info Utama */}
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div className="w-full">
          <Skeleton className="h-8 w-2/3 mb-3" /> {/* Judul Laporan */}
          <Skeleton className="h-4 w-full mt-2" /> {/* Deskripsi baris 1 */}
          <Skeleton className="h-4 w-5/6 mt-2" /> {/* Deskripsi baris 2 */}
        </div>
        <Skeleton className="h-7 w-24 rounded-full ml-4 flex-shrink-0" /> {/* Badge Status */}
      </div>
    </div>

    {/* Grid Dua Kolom */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Kartu Kiri: Info Laporan */}
      <div className="bg-white p-6 rounded-lg shadow">
        <Skeleton className="h-6 w-40 mb-6" /> {/* Judul Kartu */}
        <div className="space-y-4">
          <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /></div>
          <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-28" /></div>
          <div className="flex justify-between"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-40" /></div>
          <div className="flex justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-36" /></div>
          <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-48" /></div>
          <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /></div>
          <div className="flex justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-32" /></div>
        </div>
      </div>

      {/* Kartu Kanan: Info Penanganan */}
      <div className="bg-white p-6 rounded-lg shadow">
        <Skeleton className="h-6 w-32 mb-6" /> {/* Judul Kartu */}
        <div className="space-y-3">
          <div>
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-36 mt-2" />
          </div>
        </div>
      </div>
    </div>

    {/* Kartu Timeline */}
    <div className="bg-white p-6 rounded-lg shadow">
      <Skeleton className="h-6 w-40 mb-6" /> {/* Judul Kartu */}
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>

    {/* Kartu Media */}
    <div className="bg-white p-6 rounded-lg shadow">
      <Skeleton className="h-6 w-24 mb-4" /> {/* Judul Kartu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="w-full h-48 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonAdminDashboard: React.FC = () => (
  <div className="space-y-12">
    {/* Header */}
    <div className="animate-pulse">
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-96" />
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
    </div>

    {/* Baris Chart Pertama (2 chart) */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <SkeletonChart />
      </div>
      <SkeletonChart />
    </div>
    
    {/* Baris Chart Kedua (1 chart) */}
    <section>
        <SkeletonChart />
    </section>

    {/* Manajemen Laporan */}
    <section className="space-y-8">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <SkeletonFilterSection />
        <SkeletonTable rows={5} />
    </section>
  </div>
);