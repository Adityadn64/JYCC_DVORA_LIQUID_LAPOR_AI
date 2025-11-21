interface SkeletonProps {
  className?: string;
}

interface SkeletonChartProps {
  height?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "h-4 w-full" }) => (
  <div
    className={`${className} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse`}
  />
);

const SkeletonChart: React.FC<SkeletonChartProps> = ({ height = "[48px]" }) => (
  <div className="bg-white rounded-lg shadow space-y-4 animate-pulse">
    <Skeleton className={`h-${height} w-full rounded`} />
  </div>
);

export { Skeleton, SkeletonChart };
