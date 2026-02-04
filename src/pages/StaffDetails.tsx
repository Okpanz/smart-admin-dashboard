import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, Calendar, CheckCircle, Clock, Activity, Building2 } from 'lucide-react';
import api from '../lib/api';

interface ActivityLog {
  _id: string;
  action: string;
  target_resource: string;
  timestamp: string;
}

interface UserDetails {
  _id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  service_id: string;
  service_name?: string;
  createdAt: string;
  stats: {
    totalEnrollments: number;
    recentActivity: ActivityLog[];
  };
}

export function StaffDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchUserDetails(id);
    }
  }, [id]);

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await api.get(`/users/${userId}`);
      const data = response.data.data || response.data;
      setUser(data);
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      setError('Failed to load staff details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">{error || 'User not found'}</p>
        <button 
          onClick={() => navigate('/staff')}
          className="text-primary-600 hover:underline"
        >
          Back to Staff List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/staff')}
        className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Staff List
      </button>

      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary-50 blur-3xl opacity-50"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <img 
            src={`https://ui-avatars.com/api/?name=${user.name}&background=random&size=128`} 
            alt={user.name}
            className="h-32 w-32 rounded-2xl shadow-md border-4 border-white"
          />
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500 font-mono text-sm mt-1">@{user.username}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                {user.email}
              </div>
              <div className="flex items-center px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 capitalize">
                <Shield className="h-4 w-4 mr-2 text-gray-400" />
                {user.role}
              </div>
              <div className="flex items-center px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                {user.service_name || `Service ID: ${user.service_id}`}
              </div>
              <div className="flex items-center px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium text-sm">Total Enrollments</h3>
            <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{user.stats.totalEnrollments}</p>
          <p className="text-sm text-gray-400 mt-1">Successful registrations</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium text-sm">Last Active</h3>
            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {user.stats.recentActivity.length > 0 
              ? new Date(user.stats.recentActivity[0].timestamp).toLocaleDateString()
              : 'Never'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
             {user.stats.recentActivity.length > 0 
              ? new Date(user.stats.recentActivity[0].timestamp).toLocaleTimeString()
              : 'No activity recorded'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium text-sm">Recent Actions</h3>
            <div className="h-10 w-10 bg-purple-50 rounded-full flex items-center justify-center">
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{user.stats.recentActivity.length}</p>
          <p className="text-sm text-gray-400 mt-1">Actions in last 10 logs</p>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Recent System Activity</h3>
        <div className="space-y-6 relative">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-100"></div>
          
          {user.stats.recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activity recorded.</p>
          ) : (
            user.stats.recentActivity.map((log) => (
              <div key={log._id} className="flex gap-4 relative z-10">
                <div className="h-8 w-8 rounded-full bg-white border-2 border-primary-100 flex items-center justify-center shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {log.action.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(log.timestamp).toLocaleString()} • {log.target_resource}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
