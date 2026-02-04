import { MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Activity {
    user: string;
    action: string;
    time: string;
    avatar: string;
    section: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
        try {
            const response = await api.get('/audit/logs');
            const logs = response.data.data || [];
            
            const formattedLogs = logs.map((log: { timestamp: string; performed_by: string; action: string }) => {
                const date = new Date(log.timestamp);
                const isToday = new Date().toDateString() === date.toDateString();
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const isYesterday = yesterday.toDateString() === date.toDateString();

                return {
                    user: log.performed_by,
                    action: `${log.action.toLowerCase().replace(/_/g, ' ')}`,
                    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    avatar: `https://ui-avatars.com/api/?name=${log.performed_by}&background=random`,
                    section: isToday ? 'Today' : (isYesterday ? 'Yesterday' : 'Older')
                };
            });

            setActivities(formattedLogs);
        } catch (error) {
            console.error('Failed to fetch system logs:', error);
        } finally {
            setLoading(false);
        }
    };

    fetchLogs();
  }, []);

  if (loading) {
      return (
          <div className="rounded-3xl bg-white p-6 shadow-sm flex-1 h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
      );
  }

  const groupedActivities = activities.reduce((acc: Record<string, Activity[]>, activity) => {
      if (!acc[activity.section]) acc[activity.section] = [];
      acc[activity.section].push(activity);
      return acc;
  }, {});

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm flex-1">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">System Logs</h3>
        <button className="p-1 rounded-lg hover:bg-gray-100">
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-6 max-h-[400px] overflow-y-auto">
        {Object.keys(groupedActivities).length === 0 && (
            <p className="text-center text-gray-500 py-4">No recent activity</p>
        )}

        {Object.keys(groupedActivities).map((section) => (
            <div key={section}>
                <h4 className="text-xs font-medium text-gray-400 mb-4">{section}</h4>
                <div className="space-y-6 relative">
                    <div className="absolute left-3.5 top-2 bottom-0 w-px bg-gray-100"></div>

                    {groupedActivities[section].map((activity: Activity, idx: number) => (
                        <div key={idx} className="flex space-x-4 relative z-10">
                            <img className="h-7 w-7 rounded-full object-cover border-2 border-white shadow-sm" src={activity.avatar} alt="" />
                            <div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    <span className="font-bold text-gray-900">{activity.user}</span> {activity.action}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}

