interface SkeletonProps {
  className: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "h-4 w-full" }) => (
  <div
    className={`${className} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse`}
  />
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
  </tr>
);

const SkeletonReportDetailPage: React.FC = () => (
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
        <Skeleton className="h-7 w-24 rounded-full ml-4 flex-shrink-0" />{" "}
        {/* Badge Status */}
      </div>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <Skeleton className="h-6 w-40 mb-6" /> {/* Judul Kartu */}
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>

    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <Skeleton className="h-6 w-32 mb-6" /> {/* Judul Kartu */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-48" />
          {/* <Skeleton className="h-3 w-36 mt-2" /> */}
        </div>
      </div>
      {/* <div className="bg-white p-6 rounded-lg shadow tes"> */}
      <Skeleton className="h-6 w-32 mb-6" /> {/* Judul Kartu */}
      <div className="space-y-4">
        {[1].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="w-4 h-4 rounded-full" />
            <div className="flex justify-between w-full">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ))}
      </div>
      {/* </div> */}
    </div>

    {/* Kartu Timeline */}
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
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Kartu Media */}
    <div className="bg-white p-6 rounded-lg shadow">
      <Skeleton className="h-6 w-24 mb-4" /> {/* Judul Kartu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-full h-48 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);

export { SkeletonReportCard, SkeletonReportDetailPage };
