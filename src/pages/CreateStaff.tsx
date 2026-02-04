import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Mail, Lock, User, Building2 } from 'lucide-react';
import api from '../lib/api';

interface Service {
  _id: string;
  name: string;
  service_id: string;
}

export function CreateStaff() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    service_id: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services?limit=1000'); // Fetch all services (or enough to cover reasonable amount)
      // The API returns { success, statusCode, data: [...services], message } or direct array
      // Based on common patterns in this project (standard response wrapper)
      let data = response.data.data || response.data;

      // Handle pagination wrapper { data: [], meta: {} }
      if (data && data.data && Array.isArray(data.data)) {
          data = data.data;
      }

      if (Array.isArray(data)) {
         setServices(data);
      } else {
         console.error('Unexpected services data format', data);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
      // Fallback or error handling if needed, but we can let the user try anyway or show empty list
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        await api.post('/auth/create-adhock-staff', formData);
        
        // Show success message or redirect
        navigate('/'); // Navigate back to dashboard or staff list
    } catch (err) {
        console.error(err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (err as any).response?.data?.message || 'Failed to create staff member. Please try again.';
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Adhock Staff</h1>
          <p className="text-gray-500 mt-1">Add a new staff member to the system</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8">
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Personal Info */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <User className="h-5 w-5 mr-2 text-primary-600" />
                        Personal Information
                    </h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                required
                                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                placeholder="john@smartverify.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column - Access & Security */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Building2 className="h-5 w-5 mr-2 text-primary-600" />
                        Access & Security
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Assignment
                        </label>
                        <select
                            required
                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            value={formData.service_id}
                            onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                        >
                            <option value="">Select a service...</option>
                            {services.map(service => (
                                <option key={service.service_id} value={service.service_id}>
                                    {service.name} ({service.service_id})
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">The staff member will be tied to this service.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center px-6 py-3 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating...
                        </>
                    ) : (
                        <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create Staff Member
                        </>
                    )}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
