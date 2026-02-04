/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { FileText, Clock, User, Shield, Search, Filter } from 'lucide-react';
import api from '../lib/api';
import { Pagination } from '../components/common/Pagination';

interface AuditLog {
  _id: string;
  action: string;
  performed_by: string;
  performed_by_details?: {
    name: string;
    service_id: number;
    username: string;
  };
  target_resource: string;
  target_id: string;
  details: unknown;
  timestamp: string;
  ip_address?: string;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20; // Default limit for audit logs

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
        fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string | number> = {
          page: currentPage,
          limit: itemsPerPage
      };
      if (searchTerm) {
          params.search = searchTerm;
      }

      const response = await api.get('/audit/logs', { params });
      const responseData = response.data.data || response.data;
      
      if (responseData.data && Array.isArray(responseData.data)) {
        setLogs(responseData.data);
        if (responseData.meta) {
            setTotalPages(responseData.meta.pages);
            setTotalItems(responseData.meta.total);
        }
      } else if (Array.isArray(responseData)) {
        setLogs(responseData);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
      setCurrentPage(page);
  };

  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const renderDetails = (log: AuditLog) => {
    const details: any = log.details;
    if (!details) return <span className="text-gray-400">-</span>;

    if (log.action === 'VERIFICATION_CHECK') {
        return (
            <div className="text-sm">
                <div className="font-medium text-gray-900">{details.employeeName}</div>
                <div className="text-xs text-gray-500">ID: {details.identifier}</div>
                <div className={`text-xs mt-1 inline-flex px-2 py-0.5 rounded-full ${
                    details.status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {details.status}
                </div>
            </div>
        );
    }

    if (log.action.includes('ENROLLMENT')) {
         return (
            <div className="text-sm">
                <div className="font-medium text-gray-900">{details.employeeName}</div>
                <div className="text-xs text-gray-500">ID: {details.employeeId}</div>
                <div className="text-xs text-gray-400 mt-1">
                    {details.platform} • {details.imageCount || 0} imgs • {details.documentCount || 0} docs
                </div>
            </div>
        );
    }
    
    // Default renderer
    return (
        <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded border border-gray-100 max-w-xs overflow-hidden">
            {JSON.stringify(details, null, 2)}
        </pre>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Monitor system activity and security events</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Shield className="h-4 w-4 mr-2" />
            Export Logs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading audit logs...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {log.performed_by_details?.name || log.performed_by || 'System'}
                        </div>
                      </div>
                      {log.performed_by_details && (
                        <div className="text-xs text-gray-500 ml-6">
                          {log.performed_by_details.username}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{log.target_resource}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      {renderDetails(log)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && logs.length > 0 && (
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
            />
        )}
      </div>
    </div>
  );
}
