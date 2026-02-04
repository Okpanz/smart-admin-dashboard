import { Bell, Search, Moon, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const {user} = useAuth();
  console.log(user)
  return (
    <header className="flex h-16 items-center justify-between px-6 bg-transparent">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="mr-4 text-gray-500 focus:outline-none md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            className="block w-64 rounded-full border-none bg-white py-2 pl-4 pr-10 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-sm"
            placeholder="Search placeholder"
          />
        </div>

        {/* Icons */}
        <div className="flex items-center space-x-3">
          <button className="rounded-full bg-white p-2 text-gray-500 hover:text-gray-700 shadow-sm">
            <Moon className="h-5 w-5" />
          </button>
          <button className="relative rounded-full bg-white p-2 text-gray-500 hover:text-gray-700 shadow-sm">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>
        </div>

        {/* User Profile */}
        {/* <div className="flex items-center space-x-3 bg-white rounded-full pl-1 pr-4 py-1 shadow-sm cursor-pointer hover:bg-gray-50">
          <img
            className="h-8 w-8 rounded-full object-cover border-2 border-primary-100"
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Andrew Forbist"
          />
          <span className="text-sm font-semibold text-gray-700">Andrew Forbist</span>
        </div> */}
      </div>
    </header>
  );
}
