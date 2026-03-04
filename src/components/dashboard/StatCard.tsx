import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  onClick?: () => void;
}

export function StatCard({ label, value, change, trend, icon: Icon, onClick }: StatCardProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm flex-1 min-w-0 transition-transform duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-1"
      )}
      onClick={onClick}
    >
      <div
        className={clsx(
          'absolute inset-0 opacity-5 pointer-events-none',
          trend === 'up'
            ? 'bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-900'
            : trend === 'down'
              ? 'bg-gradient-to-br from-red-400 via-red-600 to-red-900'
              : 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600'
        )}
      />

      <div className="relative flex justify-between items-start mb-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-400 mr-2">
          {label}
        </p>
        <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center shadow-inner">
          <Icon className="h-5 w-5 text-gray-500" />
        </div>
      </div>

      <h3 className="relative text-2xl font-bold text-gray-900 mb-2">{value}</h3>

      <div className="relative mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
              trend === 'up'
                ? 'bg-emerald-50 text-emerald-700'
                : trend === 'down'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-gray-50 text-gray-700'
            )}
          >
            {trend === 'up' && <ArrowUpRight className="mr-1 h-3 w-3" />}
            {trend === 'down' && <span className="mr-1 text-[10px] leading-none">▼</span>}
            {change}
          </span>
        </div>
        <span className="text-xs text-gray-400">Today</span>
      </div>
    </div>
  );
}
