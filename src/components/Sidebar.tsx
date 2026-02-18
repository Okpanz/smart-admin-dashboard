import {
  LayoutDashboard,
  Users,
  Building2,
  UserCog,
  FileText,
  Shield,
  DoorOpen,
  X,
  Activity
} from 'lucide-react';
import clsx from 'clsx';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SmartVerifyIcon from '../assets/icon.png';
import { RefreshCw } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const allowedLivenessServiceIds = ['234082052', '234078915', '234079021', '234080703'];
  const canAccessLivenessReport =
    user?.role === 'service_admin' && user.service_id && allowedLivenessServiceIds.includes(String(user.service_id));
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Enrollments', icon: Users, path: '/enrollments' },
    { name: 'Services', icon: Building2, path: '/services' },
    { name: 'Staff Management', icon: UserCog, path: '/staff' },
    { name: 'Audit Logs', icon: FileText, path: '/audit' },
    { name: 'System Health', icon: Shield, path: '/health' },
    { name: 'Sync', icon: RefreshCw, path: '/sync' },
    { name: 'Liveness Report', icon: Activity, path: '/liveness-report' },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.name === 'Liveness Report') {
      return canAccessLivenessReport;
    }
    if (user?.role === 'service_admin') {
      return !['Services', 'System Health'].includes(item.name);
    }
    return true;
  });

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };
  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-gray-900 bg-opacity-50 transition-opacity md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-gray-50 border-r border-gray-100 transition-transform duration-300 ease-in-out md:static md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <img src={SmartVerifyIcon} alt="SmartVerify Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">SmartVerify</span>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-500 focus:outline-none">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <div className="flex items-center">
                  <item.icon
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="group mb-5 flex w-full items-center justify-center rounded-lg bg-red-600 py-2.5 text-xs font-semibold text-white transition-all hover:bg-red-700 active:scale-95"
          >
            <span>Logout</span>
            <DoorOpen className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>

        </div>
      </div>
    </>
  );
}
