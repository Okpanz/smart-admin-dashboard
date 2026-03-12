/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Download, AlertCircle, Eye, CheckCircle, XCircle, Calendar, Building2, User as UserIcon, FileText, SlidersHorizontal } from 'lucide-react';
import api from '../lib/api';
import { Pagination } from '../components/common/Pagination';
import { format } from 'date-fns';

interface Enrollment {
  _id: string;
  employeeId: string;
  fullname: string;
  department: string;
  serviceId: string;
  status: string;
  createdAt: string;
  dob?: string;
  firstAppointmentDate?: string;
  biometrics: {
    images: string[];
    fingerprints: string[];
  };
  documents: {
    uri: string;
    type: string;
  }[];
  auditTrail: {
    action: string;
    performedBy: string;
    timestamp: string;
    details: string;
  }[];
}

export function Enrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [staff, setStaff] = useState<{ _id: string, name: string }[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const navigate = useNavigate();

  // Filters
  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as any) || 'all';
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>(initialStatus);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Stats State
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    rejected: 0,
    unverified: 0,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchEnrollments();
      fetchStats(); // Update stats when filters might change (though stats usually global, let's keep them somewhat dynamic or static?)
      // actually stats should probably be global or based on current context. Let's make them global for now (all time)
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, selectedStaffId, statusFilter, dateFrom, dateTo]);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/users');
      const data = response.data.data?.data || response.data.data || response.data;
      if (Array.isArray(data)) {
        setStaff(data);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const fetchStats = async () => {
    try {
      // Parallel requests to get counts
      // Note: This depends on API capabilities. If API doesn't support generic stats endpoint, we might have to filter.
      // Assuming /mobile/v1/enrollments returns pagination meta, we can use limit=1 to get counts.

      const params = (status: string) => ({ limit: 1, status: status !== 'total' ? status : undefined });

      const [totalRes, verifiedRes, rejectedRes, unverifiedRes] = await Promise.all([
        api.get('/mobile/v1/enrollments', { params: params('total') }),
        api.get('/mobile/v1/enrollments', { params: params('verified') }),
        api.get('/mobile/v1/enrollments', { params: params('rejected') }),
        api.get('/mobile/v1/enrollments', { params: params('unverified') })
      ]);

      const getCount = (res: any) => res.data.data?.meta?.total || res.data.meta?.total || 0;

      setStats({
        total: getCount(totalRes),
        verified: getCount(verifiedRes),
        rejected: getCount(rejectedRes),
        unverified: getCount(unverifiedRes)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const fmtDate = (v?: string) => {
        if (!v) return '';
        const d = new Date(v);
        return isNaN(d.getTime()) ? v : format(d, 'yyyy-MM-dd');
      };
      const fmtDateTime = (v?: string) => {
        if (!v) return '';
        const d = new Date(v);
        return isNaN(d.getTime()) ? v : format(d, 'yyyy-MM-dd HH:mm');
      };

      const params: Record<string, string | number> = {
        page: 1,
        limit: 10000 // Fetch large amount
      };

      if (selectedStaffId) params.staff_id = selectedStaffId;
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      const response = await api.get('/mobile/v1/enrollments', { params });
      const data = response.data.data?.data || response.data.data || [];

      if (Array.isArray(data) && data.length > 0) {
        const XLSX = await import('xlsx');
        const exportData = data.map((item: any) => {
          const row: Record<string, string | number> = {};
          row['Employee ID'] = item.employeeId || '';
          row['Full Name'] = item.fullname || '';
          row['Department'] = item.department || '';
          row['DOB'] = fmtDate(item.dob);
          row['Date Of First Appointment'] = fmtDate(item.firstAppointmentDate);
          row['Status'] = item.status || '';
          row['Date Created'] = fmtDateTime(item.createdAt);
          row['Images'] = item.biometrics?.images?.length || 0;
          row['Fingerprints'] = item.biometrics?.fingerprints?.length || 0;
          return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();

        // Column widths (auto-fit approximation)
        const headers = Object.keys(exportData[0]);
        const colWidths = headers.map((h) => {
          const headerLen = h.length;
          const maxDataLen = exportData.reduce((max, r) => {
            const v = r[h];
            const len = String(v ?? '').length;
            return Math.max(max, len);
          }, 0);
          const wch = Math.min(Math.max(headerLen, maxDataLen) + 2, 40);
          return { wch };
        });
        (ws as any)['!cols'] = colWidths;

        // Auto filter on header row
        if (ws['!ref']) {
          (ws as any)['!autofilter'] = { ref: ws['!ref'] };
        }
        XLSX.utils.book_append_sheet(wb, ws, "Enrollments");
        XLSX.writeFile(wb, `Enrollments_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        console.warn('No data to export');
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (selectedStaffId) params.staff_id = selectedStaffId;
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      const response = await api.get('/mobile/v1/enrollments', { params });

      const responseData = response.data.data || response.data;

      // Handle new paginated format
      if (responseData.data && Array.isArray(responseData.data)) {
        setEnrollments(responseData.data);
        if (responseData.meta) {
          setTotalPages(responseData.meta.pages);
          setTotalItems(responseData.meta.total);
        }
      } else if (Array.isArray(responseData)) {
        // Fallback for old format
        setEnrollments(responseData);
      } else {
        console.error('Unexpected data format:', responseData);
        setEnrollments([]);
      }
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
      setError('Failed to load enrollments. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchStats();
    fetchEnrollments();
    fetchStaff();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewEnrollment = (enrollment: Enrollment) => {
    navigate(`/enrollments/${enrollment._id}`, { state: { enrollment } });
  };



  const getStatusDisplay = (enrollment: Enrollment) => {
    switch (enrollment.status) {
      case 'VERIFIED':
      case 'verified':
      case 'ENROLLED':
        return {
          label: 'Verified',
          classes: 'bg-green-100 text-green-700 border border-green-200'
        };
      case 'UNVERIFIED':
      case 'pending':
      case 'DOCUMENT SCANNING':
        return {
          label: 'Unverified',
          classes: 'bg-yellow-100 text-yellow-700 border border-yellow-200'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          classes: 'bg-red-100 text-red-700 border border-red-200'
        };
      default:
        return {
          label: 'Unverified',
          classes: 'bg-yellow-100 text-yellow-700 border border-yellow-200'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Enrollments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase">Verified</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.verified.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase">Unverified</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.unverified.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFiltersMobile(v => !v)}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            aria-label="Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <span className="animate-spin mr-0 md:mr-2">⏳</span> : <Download className="w-4 h-4 mr-0 md:mr-2" />}
            <span className="hidden md:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 ${showFiltersMobile ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-4`}>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div className="w-40 relative">
            <select
              className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Unverified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Staff Filter */}
          <div className="w-48 relative">
            <select
              className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Staff</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm"
            />
          </div>

          {(dateFrom || dateTo || statusFilter !== 'all' || selectedStaffId) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setStatusFilter('all');
                setSelectedStaffId('');
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checklist</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading enrollments...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-12 h-12 text-red-300 mb-2" />
                      <p className="text-lg font-medium text-red-600">{error}</p>
                      <button
                        onClick={handleRetry}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-12 h-12 text-gray-300 mb-2" />
                      <p className="text-lg font-medium">No enrollments found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                enrollments.map((enrollment) => (
                  <tr key={enrollment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {enrollment.fullname.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{enrollment.fullname}</div>
                          <div className="text-sm text-gray-500">{enrollment.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{enrollment.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(enrollment.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(enrollment.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const { label, classes } = getStatusDisplay(enrollment);
                        return (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col space-y-1">
                        <span className="flex items-center gap-1" title="Images">
                          {enrollment.biometrics?.images?.length > 0 ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )} Pictures ({enrollment.biometrics?.images?.length || 0})
                        </span>
                        <span className="flex items-center gap-1" title="Documents">
                          {enrollment.documents?.length > 0 ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )} Documents ({enrollment.documents?.length || 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewEnrollment(enrollment)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end w-full"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Loading enrollments...</div>
        ) : error ? (
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="w-8 h-8 text-red-300 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">No enrollments found</p>
          </div>
        ) : (
          enrollments.map((enrollment) => {
            const status = getStatusDisplay(enrollment);
            return (
              <div key={enrollment._id} className="bg-white border border-gray-200 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                      {enrollment.fullname.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-semibold text-gray-900 line-clamp-1">{enrollment.fullname}</div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1">
                        <UserIcon className="w-3 h-3" /> {enrollment.employeeId}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.classes}`}>{status.label}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-600">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span className="line-clamp-1">{enrollment.department}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(enrollment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>Pix {enrollment.biometrics?.images?.length || 0}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-gray-500" />
                      <span>Docs {enrollment.documents?.length || 0}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewEnrollment(enrollment)}
                    className="text-indigo-600 hover:text-indigo-800 inline-flex items-center"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}
