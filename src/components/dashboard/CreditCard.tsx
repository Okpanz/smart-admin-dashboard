import { ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';

export function CreditCard() {
  const { user } = useAuth();
  const [sessionTime, setSessionTime] = useState('0m');

  useEffect(() => {
    // Simple session timer starting from component mount
    const startTime = Date.now();
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 60000);
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      setSessionTime(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-3xl bg-dark-900 p-6 text-white relative overflow-hidden h-56 flex flex-col justify-between">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-primary-500/20 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-primary-500/10 blur-2xl"></div>

      <div className="relative z-10 flex justify-between items-start">
        <div className="flex space-x-3 items-center">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role === 'admin' ? 'Super Admin' : user?.role || 'Staff'}</p>
          </div>
        </div>
        <ShieldCheck className="h-8 w-8 text-primary-500" />
      </div>

      <div className="relative z-10 mt-2">
        <p className="text-xs text-gray-400 mb-1">User ID</p>
        <h2 className="text-xl font-bold tracking-tight font-mono truncate">
          {user?.username?.toUpperCase() || user?.id?.substring(0, 8).toUpperCase() || 'UNKNOWN'}
        </h2>
      </div>

      <div className="relative z-10 flex justify-between items-end mt-4">
        <div className="flex space-x-8">
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase">Status</p>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-sm font-semibold">Active</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase">Session</p>
            <p className="text-sm font-semibold">{sessionTime}</p>
          </div>
        </div>
        <div className="text-right">
             <p className="text-[10px] font-medium text-gray-400 uppercase">Role</p>
             <p className="text-sm font-semibold text-primary-300">
               {user?.role === 'admin' ? 'Level 5' : 'Level 1'}
             </p>
        </div>
      </div>
    </div>
  );
}
