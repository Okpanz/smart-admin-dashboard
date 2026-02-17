/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/static-components */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo, useState, useEffect } from 'react';

interface ChartData {
  name: string;
  verifications: number;
  enrollments: number;
}

interface Props {
  data?: ChartData[];
  className?: string;
}

export function WeeklyActivityChart({ data = [], className = '' }: Props) {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalVerifications = useMemo(
    () => data.reduce((sum, item) => sum + (item.verifications || 0), 0),
    [data]
  );
  const totalEnrollments = useMemo(
    () => data.reduce((sum, item) => sum + (item.enrollments || 0), 0),
    [data]
  );

  const maxValue = useMemo(() => {
    if (data.length === 0) return 0;
    const max = Math.max(
      ...data.map(item => Math.max(item.verifications || 0, item.enrollments || 0))
    );
    return max === 0 ? 10 : max + Math.ceil(max * 0.2); // Add 20% padding or default to 10
  }, [data]);

  const getBarSize = () => {
    if (windowWidth < 380) return 6;
    if (windowWidth < 640) return 8;
    return 12;
  };

  const getBarGap = () => {
    if (windowWidth < 380) return 3;
    if (windowWidth < 640) return 4;
    return 6;
  };

  const getMaxBarSize = () => {
    if (windowWidth < 380) return 12;
    if (windowWidth < 640) return 16;
    return 20;
  };

  const getTickFontSize = () => {
    if (windowWidth < 380) return 7;
    if (windowWidth < 640) return 8;
    return 10;
  };

  const shouldIntervalTicks = () => {
    return windowWidth < 380;
  };

  if (!data.length) {
    return (
      <div className={`rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Weekly Activity</h3>
        </div>
        <div className="h-32 sm:h-40 flex items-center justify-center text-xs sm:text-sm text-gray-400">
          No activity recorded for this week yet.
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-3 border border-gray-100">
          <p className="font-semibold text-gray-800 text-xs sm:text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">
                {entry.name === 'verifications' ? 'Verifications' : 'Enrollments'}:
              </span>
              <span className="font-semibold text-gray-800">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm ${className}`}>
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Weekly Activity</h3>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-primary-300" />
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Verifications</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-dark-900" />
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Enrollments</span>
          </div>
        </div>
      </div>

      <div className="mb-3 sm:mb-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 text-[10px] sm:text-xs text-gray-500">
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <span>
            Total verifications: <span className="font-semibold text-gray-800">{totalVerifications}</span>
          </span>
          <span>
            Total enrollments: <span className="font-semibold text-gray-800">{totalEnrollments}</span>
          </span>
        </div>
        <span className="text-[9px] sm:text-[11px] uppercase tracking-wide bg-gray-50 px-2 py-1 rounded-full">
          Last 7 days
        </span>
      </div>

      <div className="h-40 sm:h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            barSize={getBarSize()} 
            barGap={getBarGap()}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#E5E7EB" 
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: getTickFontSize(), 
                fill: '#9CA3AF',
                fontWeight: 400
              }}
              dy={windowWidth < 640 ? 8 : 10}
              interval={shouldIntervalTicks() ? 1 : 0}
            />
            <YAxis 
              hide 
              domain={[0, maxValue]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(15, 23, 42, 0.03)' }}
              content={<CustomTooltip />}
            />
            <Bar
              dataKey="verifications"
              fill="#6ee7b7"
              radius={[8, 8, 4, 4]}
              maxBarSize={getMaxBarSize()}
              animationDuration={500}
              animationEasing="ease-in-out"
            />
            <Bar
              dataKey="enrollments"
              fill="#064e3b"
              radius={[8, 8, 4, 4]}
              maxBarSize={getMaxBarSize()}
              animationDuration={500}
              animationEasing="ease-in-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}