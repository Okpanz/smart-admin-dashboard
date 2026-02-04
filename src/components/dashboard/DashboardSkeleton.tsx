import { Skeleton } from '../common/Skeleton';

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left Column (30%) */}
      <div className="w-full xl:w-[30%] flex flex-col gap-6">
        {/* Credit Card Skeleton */}
        <Skeleton className="h-48 w-full rounded-2xl" />
        
        {/* Quick Actions Skeleton */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>

        {/* System Status Skeleton */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex-1">
           <Skeleton className="h-6 w-32 mb-4" />
           <div className="space-y-4">
             <div className="flex justify-between items-center">
                 <div className="flex items-center space-x-3 w-1/2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                 </div>
                 <Skeleton className="h-6 w-20 rounded-full" />
             </div>
             <div className="flex justify-between items-center">
                 <div className="flex items-center space-x-3 w-1/2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                 </div>
                 <Skeleton className="h-6 w-20 rounded-full" />
             </div>
             <div className="flex justify-between items-center">
                 <div className="flex items-center space-x-3 w-1/2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                 </div>
                 <Skeleton className="h-6 w-20 rounded-full" />
             </div>
           </div>
        </div>
      </div>

      {/* Middle Column (45%) */}
      <div className="w-full xl:w-[45%] flex flex-col gap-6">
        {/* Stats Row */}
        <div className="flex flex-col sm:flex-row gap-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
        </div>

        {/* Trend Chart Skeleton */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-24 rounded-lg" />
             </div>
             <Skeleton className="h-64 w-full" />
        </div>
        
        {/* Recent Enrollments Skeleton */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
            </div>
        </div>
      </div>

      {/* Right Column (25%) */}
      <div className="w-full xl:w-[25%] flex flex-col gap-6">
        {/* Weekly Activity Chart Skeleton */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-48 w-full" />
        </div>
        
        {/* Recent Activity Skeleton */}
         <div className="bg-white rounded-2xl p-6 shadow-sm flex-1">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-6">
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
