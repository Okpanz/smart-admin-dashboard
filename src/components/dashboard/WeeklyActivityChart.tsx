import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  verifications: number;
  enrollments: number;
}

interface Props {
  data?: ChartData[];
}

export function WeeklyActivityChart({ data = [] }: Props) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Weekly Activity</h3>
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-primary-300"></span>
                <span className="text-xs text-gray-500 font-medium">Verifications</span>
            </div>
            <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-dark-900"></span>
                <span className="text-xs text-gray-500 font-medium">Enrollments</span>
            </div>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={12} barGap={4}>
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                dy={10}
            />
            <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar dataKey="verifications" fill="#6ee7b7" radius={[10, 10, 10, 10]} />
            <Bar dataKey="enrollments" fill="#064e3b" radius={[10, 10, 10, 10]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
