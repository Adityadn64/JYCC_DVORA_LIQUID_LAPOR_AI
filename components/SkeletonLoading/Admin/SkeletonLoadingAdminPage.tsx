interface SkeletonPieceProps {
  className: string;
}

interface SkeletonProps {
  className: string;
}

interface SkeletonChartProps {
  height?: string;
}

const SkeletonChart: React.FC<SkeletonChartProps> = ({ height = "[48px]" }) => (
  <div className="bg-white rounded-lg shadow space-y-4 animate-pulse">
    <Skeleton className={`h-${height} w-full rounded`} />
  </div>
);

const SkeletonPiece: React.FC<SkeletonPieceProps> = ({ className }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

const Skeleton: React.FC<SkeletonProps> = ({ className = "h-4 w-full" }) => (
  <div
    className={`${className} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse`}
  />
);

const SkeletonFilter: React.FC = () => (
  <div className="mb-8 bg-white p-6 rounded-xl shadow-lg border">
    <SkeletonPiece className="h-6 w-1/4 mb-4" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonPiece key={i} className="h-10 w-full" />
      ))}
    </div>
    <div className="mt-6 flex items-center justify-end gap-x-4">
      <SkeletonPiece className="h-5 w-20" />
      <SkeletonPiece className="h-10 w-28" />
    </div>
  </div>
);

const SkeletonInsights: React.FC = () => (
  <div className="mb-8 space-y-3">
    <SkeletonPiece className="h-6 w-48" />
    <SkeletonPiece className="h-16 w-full" />
  </div>
);

const SkeletonKpiCards: React.FC = () => (
  <div className="mb-8">
    <SkeletonPiece className="h-7 w-1/3 mb-4" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow border">
          <SkeletonPiece className="h-4 w-3/4" />
          <SkeletonPiece className="h-8 w-1/2 mt-2" />
        </div>
      ))}
    </div>
  </div>
);

const SkeletonAnalysisTableCard: React.FC = () => (
  <div className="bg-white p-6 rounded-xl shadow border">
    <SkeletonPiece className="h-5 w-1/3 mb-4" />
    <div className="space-y-2 mt-4">
      <SkeletonPiece className="h-4 w-full" />
      <SkeletonPiece className="h-4 w-11/12" />
      <SkeletonPiece className="h-4 w-full" />
      <SkeletonPiece className="h-4 w-10/12" />
      <SkeletonPiece className="h-4 w-full" />
    </div>
  </div>
);

const SkeletonDataGrid: React.FC = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg border">
    <div className="flex justify-between items-center mb-4">
      <SkeletonPiece className="h-7 w-1/3" />
    </div>
    <SkeletonPiece className="h-64 w-full" />
  </div>
);

const SkeletonChartCard: React.FC = () => (
  <div className="bg-white p-6 rounded-xl shadow border">
    <SkeletonPiece className="h-5 w-1/2 mb-4" />
    <SkeletonPiece className="h-80 w-full" />
  </div>
);

const SkeletonFilterSection: React.FC = () => (
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

const SkeletonTableRow: React.FC = () => (
  <tr className="border-b animate-pulse">
    <td className="px-4 py-2">
      <Skeleton className="h-4 w-16" />
    </td>
    <td className="px-4 py-2">
      <Skeleton className="h-4 w-40" />
    </td>
    <td className="px-4 py-2">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="px-4 py-2">
      <Skeleton className="h-4 w-20" />
    </td>
    <td className="px-4 py-2">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="px-4 py-2">
      <Skeleton className="h-4 w-28" />
    </td>
  </tr>
);

const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white p-6 rounded-lg shadow animate-pulse">
    <Skeleton className="h-6 w-40 mb-4" />
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left px-4 py-2">
              <Skeleton className="h-4 w-12" />
            </th>
            <th className="text-left px-4 py-2">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="text-left px-4 py-2">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="text-left px-4 py-2">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="text-left px-4 py-2">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="text-left px-4 py-2">
              <Skeleton className="h-4 w-28" />
            </th>
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

const SkeletonAdminDashboard: React.FC = () => (
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

const SkeletonReportCard: React.FC = () => (
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

const SkeletonProfileHeader: React.FC = () => (
  <div className="bg-white rounded-xl shadow p-6">
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      <div className="flex-shrink-0">
        <SkeletonPiece className="h-32 w-32 rounded-full" />
      </div>
      <div className="flex-1 space-y-3 mt-2">
        <SkeletonPiece className="h-8 w-1/2" />
        <SkeletonPiece className="h-5 w-3/4" />
        <SkeletonPiece className="h-4 w-1/3" />
        <SkeletonPiece className="h-4 w-1/2" />
        <SkeletonPiece className="h-10 w-28 mt-4" />
      </div>
    </div>
  </div>
);

const SkeletonActionCard: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className="bg-white rounded-xl shadow p-6">
    <SkeletonPiece className="h-6 w-1/3 mb-3" />
    <SkeletonPiece className="h-4 w-full mb-1" />
    <SkeletonPiece className="h-4 w-10/12 mb-4" />
    <SkeletonPiece className="h-10 w-full" />
  </div>
);

export {
  SkeletonKpiCards,
  SkeletonInsights,
  SkeletonFilter,
  SkeletonAnalysisTableCard,
  SkeletonDataGrid,
  SkeletonChartCard,
  SkeletonAdminDashboard,
  Skeleton,
  SkeletonReportCard,
  SkeletonProfileHeader,
  SkeletonActionCard,
};
