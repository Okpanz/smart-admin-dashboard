/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { FileText, Clock, User, Search, Filter, X, Download, Calendar, Users, RefreshCw } from 'lucide-react';
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [staff, setStaff] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, startDate, endDate, staff]);

  const fetchLogs = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: itemsPerPage
      };
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (staff) params.staff = staff;

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
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchLogs(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setStaff('');
    setCurrentPage(1);
  };

  const activeFilterCount = [startDate, endDate, staff, searchTerm].filter(Boolean).length;

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

    if (log.action === 'EXECUTE_ENROLLMENT_SYNC') {
      return (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            Employee: {details.employeeId || '-'}
          </div>
          <div className="text-xs text-gray-500">
            Service: {details.serviceId ?? '-'} • Base URL: {details.baseUrl || '-'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Dry run: {String(details.dryRun ?? false)}
          </div>
        </div>
      );
    }

    if (log.action === 'MARK_ENROLLMENT_SYNCED') {
      return (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            Employee: {details.employeeId || '-'}
          </div>
          <div className="text-xs text-gray-500">
            Service: {details.serviceId ?? '-'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Marked by: {details.performedBy || log.performed_by || 'System'}
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
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search Bar - Always visible */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder="Search by action, target, or staff..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Quick Stats */}
            {!isLoading && logs.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="hidden md:inline">•</span>
                <span>Showing {logs.length} of {totalItems} logs</span>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col min-w-[200px]">
                <label className="flex items-center text-xs font-medium text-gray-500 mb-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  Date Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Start date"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="date"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="End date"
                  />
                </div>
              </div>
              
              <div className="flex flex-col min-w-[250px]">
                <label className="flex items-center text-xs font-medium text-gray-500 mb-1">
                  <Users className="h-3 w-3 mr-1" />
                  Staff Member
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Filter by staff name or username..."
                    value={staff}
                    onChange={(e) => {
                      setStaff(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  {staff && (
                    <button
                      onClick={() => setStaff('')}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Active filter tags */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-50 text-primary-700 border border-primary-200">
                    Search: {searchTerm}
                    <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-primary-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {startDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-50 text-primary-700 border border-primary-200">
                    From: {new Date(startDate).toLocaleDateString()}
                    <button onClick={() => setStartDate('')} className="ml-1 hover:text-primary-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {endDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-50 text-primary-700 border border-primary-200">
                    To: {new Date(endDate).toLocaleDateString()}
                    <button onClick={() => setEndDate('')} className="ml-1 hover:text-primary-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {staff && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-50 text-primary-700 border border-primary-200">
                    Staff: {staff}
                    <button onClick={() => setStaff('')} className="ml-1 hover:text-primary-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Table content remains exactly the same */}
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
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No audit logs found</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg border border-primary-200 transition-colors"
              >
                Clear all filters
              </button>
            )}
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
