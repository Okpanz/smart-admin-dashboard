import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  enrolled: number;
  verified: number;
}

interface Props {
  data?: ChartData[];
}

export function EnrollmentTrendChart({ data = [] }: Props) {
  // console.log(data)
  const totalEnrolled = data.reduce((acc, curr) => acc + (curr.enrolled || 0), 0);
  const totalVerified = data.reduce((acc, curr) => acc + (curr.verified || 0), 0);
  const verificationRate =
    totalEnrolled > 0 ? Math.round((totalVerified / totalEnrolled) * 100) : 0;

  if (!data.length) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Verification Trends</h3>
          <span className="text-xs text-gray-400">This Year</span>
        </div>
        <div className="h-40 flex items-center justify-center text-sm text-gray-400">
          No verification data available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Verification Trends</h3>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-emerald-900" />
            <span className="text-xs text-gray-500 font-medium">Enrolled</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-primary-300" />
            <span className="text-xs text-gray-500 font-medium">Verified</span>
          </div>
          <select className="bg-gray-50 border-none text-xs font-medium text-gray-500 rounded-lg px-2 py-1 focus:ring-0 cursor-pointer hover:bg-gray-100">
            <option>This Year</option>
          </select>
        </div>
      </div>

      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {totalVerified.toLocaleString()}
          </h2>
          <p className="text-xs text-gray-500 mt-1">Total verified this year</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl px-4 py-2 flex items-center space-x-6 text-xs">
          <div>
            <span className="block text-gray-400">Total enrolled</span>
            <span className="font-bold text-gray-900">
              {totalEnrolled.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="block text-gray-400">Verification rate</span>
            <span className="font-bold text-primary-500">
              {verificationRate.toString()}%
            </span>
          </div>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={12} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              dy={10}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'rgba(15, 23, 42, 0.03)' }}
              contentStyle={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
                padding: '8px 10px',
                fontSize: 12
              }}
            />
            <Bar
              dataKey="enrolled"
              fill="#064e3b"
              radius={[0, 0, 6, 6]}
              maxBarSize={18}
            />
            <Bar
              dataKey="verified"
              fill="#6ee7b7"
              radius={[6, 6, 0, 0]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
