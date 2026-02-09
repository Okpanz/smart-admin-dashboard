import { useState, useEffect } from 'react';
import { Search, Filter, Download, AlertCircle, Eye } from 'lucide-react';
import api from '../lib/api';
import { EnrollmentDetailsModal } from '../components/enrollment/EnrollmentDetailsModal';
import { Pagination } from '../components/common/Pagination';

interface Enrollment {
  _id: string;
  employeeId: string;
  fullname: string;
  department: string;
  serviceId: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staff, setStaff] = useState<{ _id: string, name: string }[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

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
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, selectedStaffId]);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/users');
      // Handle both old array format and new paginated format if user endpoint is also updated
      const data = response.data.data?.data || response.data.data || response.data; 
      if (Array.isArray(data)) {
        setStaff(data);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string | number> = {
          page: currentPage,
          limit: itemsPerPage
      };
      
      if (selectedStaffId) {
        params.staff_id = selectedStaffId;
      }
      if (searchTerm) {
          params.search = searchTerm;
      }

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
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
      setCurrentPage(page);
  };

  const handleViewEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = (id: string, status: string) => {
    const newStatus = status as 'pending' | 'verified' | 'rejected';
    setEnrollments(prev => prev.map(e => e._id === id ? { ...e, status: newStatus } : e));
    if (selectedEnrollment && selectedEnrollment._id === id) {
      setSelectedEnrollment({ ...selectedEnrollment, status: newStatus });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Verifications</h1>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
        <div className="w-full sm:w-64">
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <select 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Biometrics</th>
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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(enrollment.status)}`}>
                        {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <span title="Images">{enrollment.biometrics.images.length} 📷</span>
                        <span title="Fingerprints">{enrollment.biometrics.fingerprints.length} 👆</span>
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
        
        {/* Pagination */}
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
        />
      </div>

      {selectedEnrollment && (
        <EnrollmentDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          enrollment={selectedEnrollment}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
