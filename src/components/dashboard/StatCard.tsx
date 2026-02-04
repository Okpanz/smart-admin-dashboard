import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
}

export function StatCard({ label, value, change, trend, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm flex-1 min-w-[200px]">
      <div className="flex justify-between items-start mb-4">
        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
          <Icon className="h-5 w-5 text-gray-500" />
        </div>
        <button className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
      </div>
      
      <div className="mb-2">
         <span className={clsx(
          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
          trend === 'up' ? "bg-primary-50 text-primary-700" : 
          trend === 'down' ? "bg-red-50 text-red-700" :
          "bg-gray-50 text-gray-700"
        )}>
          {trend === 'up' ? <ArrowUpRight className="mr-1 h-3 w-3" /> : null}
          {change}
        </span>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
