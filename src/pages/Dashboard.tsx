import { useState, useEffect } from 'react';
import { CreditCard } from '../components/dashboard/CreditCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { StatCard } from '../components/dashboard/StatCard';
import { RecentEnrollments } from '../components/dashboard/RecentEnrollments';
import { EnrollmentTrendChart } from '../components/dashboard/EnrollmentTrendChart';
import { WeeklyActivityChart } from '../components/dashboard/WeeklyActivityChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { Users, FileCheck, Building2 } from 'lucide-react';
import api from '../lib/api';

interface DashboardStats {
  total: { value: number; change: string };
  verified: { value: number; change: string };
  pending: { value: number; change: string };
  thisMonth: { value: number; change: string };
  trends: { name: string; enrolled: number; verified: number }[];
  weekly: { name: string; verifications: number; enrollments: number }[];
}

interface HealthData {
  status: string;
  uptime: number;
  timestamp: string;
  services: {
    api: boolean;
    database: boolean;
    storage: boolean;
  };
  system: {
    loadAverage: number[];
    memory: {
      total: number;
      free: number;
      used: number;
    };
  };
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchHealth();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      const data = response.data.data || response.data;
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await api.get('/health');
      const data = response.data.data || response.data;
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left Column (30%) */}
      <div className="w-full xl:w-[30%] flex flex-col gap-6">
        <CreditCard />
        <QuickActions />
        <div className="rounded-3xl bg-white p-6 shadow-sm flex-1">
             <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
             <div className="space-y-4">
                 <div className="flex justify-between items-center">
                     <div className="flex items-center space-x-3">
                         <div className={`h-2 w-2 rounded-full ${health?.services?.api ? 'bg-green-500' : 'bg-red-500'}`}></div>
                         <span className="text-sm font-medium text-gray-700">API Server</span>
                     </div>
                     <span className={`text-xs font-semibold px-2 py-1 rounded-full ${health?.services?.api ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {health?.services?.api ? 'Operational' : 'Down'}
                     </span>
                 </div>
                 <div className="flex justify-between items-center">
                     <div className="flex items-center space-x-3">
                         <div className={`h-2 w-2 rounded-full ${health?.services?.database ? 'bg-green-500' : 'bg-red-500'}`}></div>
                         <span className="text-sm font-medium text-gray-700">Database</span>
                     </div>
                     <span className={`text-xs font-semibold px-2 py-1 rounded-full ${health?.services?.database ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {health?.services?.database ? 'Operational' : 'Down'}
                     </span>
                 </div>
                 <div className="flex justify-between items-center">
                     <div className="flex items-center space-x-3">
                         <div className={`h-2 w-2 rounded-full ${health?.services?.storage ? 'bg-green-500' : 'bg-red-500'}`}></div>
                         <span className="text-sm font-medium text-gray-700">Storage</span>
                     </div>
                     <span className={`text-xs font-semibold px-2 py-1 rounded-full ${health?.services?.storage ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {health?.services?.storage ? 'Operational' : 'Down'}
                     </span>
                 </div>
             </div>
        </div>
      </div>

      {/* Middle Column (45%) */}
      <div className="w-full xl:w-[45%] flex flex-col gap-6">
        {/* Stats Row */}
        <div className="flex flex-col sm:flex-row gap-6">
            <StatCard 
                label="Total Enrollments" 
                value={loading ? "..." : stats?.total.value.toLocaleString() || "0"} 
                change={stats?.total.change || "0%"} 
                trend="up" 
                icon={Users} 
            />
            <StatCard 
                label="Verified" 
                value={loading ? "..." : stats?.verified.value.toLocaleString() || "0"} 
                change={stats?.verified.change || "0%"} 
                trend="up" 
                icon={FileCheck} 
            />
             <StatCard 
                label="Pending" 
                value={loading ? "..." : stats?.pending.value.toLocaleString() || "0"} 
                change={stats?.pending.change || "0%"} 
                trend={stats?.pending.value ? "up" : "neutral"} 
                icon={Building2} 
            />
        </div>

        <EnrollmentTrendChart data={stats?.trends} />
        <RecentEnrollments />
      </div>

      {/* Right Column (25%) */}
      <div className="w-full xl:w-[25%] flex flex-col gap-6">
        <WeeklyActivityChart data={stats?.weekly} />
        <RecentActivity />
      </div>
    </div>
  );
}
