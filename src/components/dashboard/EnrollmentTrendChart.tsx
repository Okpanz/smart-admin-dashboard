import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  enrolled: number;
  verified: number;
}

interface Props {
  data?: ChartData[];
}

export function EnrollmentTrendChart({ data = [] }: Props) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Verification Trends</h3>
        </div>
        <div className="flex items-center space-x-4">
            {/* <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-dark-900"></span>
                <span className="text-xs text-gray-500 font-medium">Enrolled</span>
            </div> */}
            <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-primary-300"></span>
                <span className="text-xs text-gray-500 font-medium">Verified</span>
            </div>
             <select className="bg-gray-50 border-none text-xs font-medium text-gray-500 rounded-lg px-2 py-1 focus:ring-0 cursor-pointer hover:bg-gray-100">
                <option>This Year</option>
            </select>
        </div>
      </div>

      <div className="flex items-end space-x-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            {data.reduce((acc, curr) => acc + curr.enrolled, 0).toLocaleString()}
          </h2>
          <div className="bg-white shadow-lg rounded-xl p-2 mb-2 flex space-x-4 text-xs">
             {/* <div>
                <span className="block text-gray-400">Enrolled</span>
                <span className="font-bold text-dark-900">
                  {data.reduce((acc, curr) => acc + curr.enrolled, 0).toLocaleString()}
                </span>
             </div> */}
             <div>
                <span className="block text-gray-400">Verified</span>
                <span className="font-bold text-primary-500">
                  {data.reduce((acc, curr) => acc + curr.verified, 0).toLocaleString()}
                </span>
             </div>
          </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={12}>
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
            <Bar dataKey="enrolled" stackId="a" fill="#064e3b" radius={[0, 0, 4, 4]} />
            <Bar dataKey="verified" stackId="a" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
