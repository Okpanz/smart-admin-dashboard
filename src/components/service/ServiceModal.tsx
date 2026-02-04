import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../lib/api';

interface Service {
  _id: string;
  name: string;
  service_id: number;
  service_base_url?: string;
}

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  service?: Service | null;
}

export function ServiceModal({ isOpen, onClose, onSuccess, service }: ServiceModalProps) {
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [serviceBaseUrl, setServiceBaseUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (service) {
      setName(service.name);
      setServiceId(service.service_id.toString());
      setServiceBaseUrl(service.service_base_url || '');
    } else {
      setName('');
      setServiceId('');
      setServiceBaseUrl('');
    }
    setError('');
  }, [service, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        service_id: parseInt(serviceId),
        service_base_url: serviceBaseUrl
      };

      if (service) {
        await api.put(`/services/${service._id}`, payload);
      } else {
        await api.post('/services', payload);
      }
      
      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err.response?.data?.message || `Failed to ${service ? 'update' : 'create'} service`;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {service ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700">
                  Service Name
                </label>
                <input
                  type="text"
                  id="serviceName"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., State Payroll"
                />
              </div>

              <div>
                <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700">
                  Service ID
                </label>
                <input
                  type="number"
                  id="serviceId"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  required
                  placeholder="e.g., 1001"
                />
              </div>

              <div>
                <label htmlFor="serviceBaseUrl" className="block text-sm font-medium text-gray-700">
                  Service Base URL
                </label>
                <input
                  type="text"
                  id="serviceBaseUrl"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={serviceBaseUrl}
                  onChange={(e) => setServiceBaseUrl(e.target.value)}
                  placeholder="e.g., https://api.example.com"
                />
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (service ? 'Update Service' : 'Create Service')}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
