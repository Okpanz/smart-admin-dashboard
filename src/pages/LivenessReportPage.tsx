import { useState, useEffect } from 'react';
import axios from 'axios';

import {
    Eye,
    CheckCircle,
    XCircle,
    Calendar,
    Loader2,
    Search
} from 'lucide-react';
const format = (date: Date) => date.toLocaleString();
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface Capture {
    _id: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
    imageMatch: number; // 1 or 0
    confidenceLevel: string;
    capturedAt: string;
    imagePath: string;
    bvn: string;
    accountNumber: string;
    empInfoId: string;
    serviceId: string;
}

interface ApiResponse {
    success: boolean;
    data: Capture[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export function LivenessReportPage() {
    const [captures, setCaptures] = useState<Capture[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
    const { token } = useAuth();

    const [matchFilter, setMatchFilter] = useState<'all' | 'match' | 'no-match'>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (token) fetchCaptures();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, matchFilter, dateFrom, dateTo, page, limit, token]);

    const fetchCaptures = async () => {
        setIsLoading(true);
        try {
            const baseUrl =
                (import.meta as { env: { [key: string]: string } }).env
                    .VITE_VERIFICATION_API_BASE_URL || 'https://i-am-alive-server.onrender.com';
            const url = `${baseUrl.replace(/\/$/, '')}/i-am-alive/captures`;

            const params: any = {
                page,
                limit,
            };

            if (searchTerm) params.employee_no = searchTerm;
            if (dateFrom) params.from_date = dateFrom;
            if (dateTo) params.to_date = dateTo;
            if (matchFilter !== 'all') params.match_status = matchFilter;

            const response = await axios.get<ApiResponse>(url, {
                headers: token
                    ? {
                        Authorization: `Bearer ${token}`
                    }
                    : undefined,
                params
            });

            if (response.data.success) {
                setCaptures(response.data.data);
                if (response.data.pagination) {
                    setTotalPages(response.data.pagination.totalPages);
                }
            } else {
                toast.error('Failed to fetch data');
            }
        } catch (error) {
            console.error('Error fetching captures:', error);
            toast.error('Error loading report data');
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrl = (path: string) => {
        if (path.startsWith('http')) return path;
        // Assuming the server serves uploads statically or we need a base URL
        const baseUrl = (import.meta as { env: { [key: string]: string } }).env.VITE_VERIFICATION_API_BASE_URL || 'https://i-am-alive-server.onrender.com';
        return `${baseUrl.replace(/\/$/, '')}/${path}`;
    };

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const baseUrl =
                (import.meta as { env: { [key: string]: string } }).env
                    .VITE_VERIFICATION_API_BASE_URL || 'https://i-am-alive-server.onrender.com';
            const url = `${baseUrl.replace(/\/$/, '')}/i-am-alive/captures`;

            // Fetch ALL data matching current filters
            const params: any = {
                page: 1,
                limit: 10000, // Fetch up to 10000 records for export
            };

            if (searchTerm) params.employee_no = searchTerm;
            if (dateFrom) params.from_date = dateFrom;
            if (dateTo) params.to_date = dateTo;
            if (matchFilter !== 'all') params.match_status = matchFilter;

            const response = await axios.get<ApiResponse>(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                params
            });

            if (response.data.success && response.data.data.length > 0) {
                // Dynamic import to avoid loading xlsx bundle unless needed
                const XLSX = await import('xlsx');

                // Format data for Excel
                const dataToExport = response.data.data.map(item => ({
                    'Employee No': item.employeeNo,
                    'First Name': item.firstName,
                    'Last Name': item.lastName,
                    'Service ID': item.serviceId || 'N/A',
                    'Info ID': item.empInfoId || 'N/A',
                    'BVN': item.bvn || 'N/A',
                    'Match Status': item.imageMatch === 1 ? 'MATCH' : 'NO MATCH',
                    'Confidence Level': item.confidenceLevel,
                    'Captured At': new Date(item.capturedAt).toLocaleString(),
                }));

                // Create workbook and worksheet
                const worksheet = XLSX.utils.json_to_sheet(dataToExport);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Liveness Report');

                // Generate file
                XLSX.writeFile(workbook, `Liveness_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
                toast.success('Export completed successfully');
            } else {
                toast.error('No data to export');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Liveness Verification Report</h1>
                    <p className="text-gray-500">View history of identity verification attempts.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="h-4 w-4 font-bold">X</div>}
                        Export to Excel
                    </button>
                    <button
                        onClick={fetchCaptures}
                        className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                        title="Refresh Data"
                    >
                        <Loader2 className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Name or Employee No..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-4">
                    <select
                        value={matchFilter}
                        onChange={(e) => setMatchFilter(e.target.value as 'all' | 'match' | 'no-match')}
                        className="block w-full md:w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                        <option value="all">All Status</option>
                        <option value="match">Match Only</option>
                        <option value="no-match">No Match Only</option>
                    </select>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">From:</span>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="block w-full md:w-auto pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">To:</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="block w-full md:w-auto pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Rows:</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1); // Reset to page 1 on limit change
                            }}
                            className="block w-20 pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        >
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={500}>All (500)</option>
                        </select>
                    </div>

                    {(dateFrom || dateTo || matchFilter !== 'all' || limit !== 20) && (
                        <button
                            onClick={() => {
                                setDateFrom('');
                                setDateTo('');
                                setMatchFilter('all');
                                setLimit(20);
                                setPage(1);
                            }}
                            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-500" />
                                        Loading data...
                                    </td>
                                </tr>
                            ) : captures.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                captures.map((capture) => (
                                    <tr key={capture._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                        src={getImageUrl(capture.imagePath)}
                                                        alt=""
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${capture.firstName}+${capture.lastName}&background=random`;
                                                        }}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{capture.firstName} {capture.lastName}</div>
                                                    <div className="text-sm text-gray-500">{capture.employeeNo}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{capture.serviceId}</div>
                                            <div className="text-xs text-gray-500">Emp Info ID: {capture.empInfoId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {capture.imageMatch === 1 ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    <CheckCircle className="h-3 w-3 mr-1 self-center" /> Match
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    <XCircle className="h-3 w-3 mr-1 self-center" /> Mismatch
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="font-medium text-gray-900">{capture.confidenceLevel}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 text-gray-400" />
                                                {format(new Date(capture.capturedAt))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedCapture(capture)}
                                                className="text-primary-600 hover:text-primary-900 bg-primary-50 p-2 rounded-lg transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {selectedCapture && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Verification Details</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedCapture.firstName} {selectedCapture.lastName} • {selectedCapture.employeeNo}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedCapture(null)}
                                className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Images Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* 1. Official Record */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        Official Record
                                    </h3>
                                    <div className="aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200 relative group">
                                        <img
                                            src={import.meta.env.DEV
                                                ? `/images/${selectedCapture.employeeNo}.png`
                                                : `https://rivers.thesmartapps.org/images/${selectedCapture.employeeNo}.png`
                                            }
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${selectedCapture.firstName}+${selectedCapture.lastName}&background=random&size=512`;
                                            }}
                                            alt="Official"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                            <p className="text-white text-xs font-medium">Source: Employee DB</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Captured Live */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        Live Capture
                                    </h3>
                                    <div className="aspect-[4/5] bg-gray-900 rounded-xl overflow-hidden shadow-md ring-4 ring-primary-50 relative group">
                                        <img
                                            src={getImageUrl(selectedCapture.imagePath)}
                                            alt="Captured"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${selectedCapture.imageMatch === 1 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                {selectedCapture.imageMatch === 1 ? 'MATCH' : 'NO MATCH'}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                            <p className="text-white text-xs font-medium">
                                                Confidence: <span className="font-bold text-green-400">{selectedCapture.confidenceLevel}</span>
                                            </p>
                                            <p className="text-gray-300 text-[10px] mt-0.5">
                                                {format(new Date(selectedCapture.capturedAt))}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. BVN Record */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                        BVN Record
                                    </h3>
                                    <div className="aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200 relative group">
                                        <img
                                            src={import.meta.env.DEV
                                                ? `/bvn-images/bvn-image-${selectedCapture.employeeNo}.jpg`
                                                : `https://rivers.thesmartapps.org/bvn-images/bvn-image-${selectedCapture.employeeNo}.jpg`
                                            }
                                            onError={(e) => {
                                                // Create a placeholder if BVN image is missing
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.querySelector('.bvn-placeholder')?.classList.remove('hidden');
                                            }}
                                            alt="BVN"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="bvn-placeholder hidden absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                                            <div className="p-4 bg-white rounded-full shadow-sm mb-2">
                                                <Eye className="h-8 w-8 opacity-50" />
                                            </div>
                                            <span className="text-xs font-medium">No Image Available</span>
                                        </div>
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                            <p className="text-white text-xs font-medium">Source: BVN Database</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Data Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">Service ID</p>
                                    <p className="font-mono text-sm font-bold text-gray-900">{selectedCapture.serviceId || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">Information ID</p>
                                    <p className="font-mono text-sm font-bold text-gray-900">{selectedCapture.empInfoId || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">BVN</p>
                                    <p className="font-mono text-sm font-bold text-gray-900">{selectedCapture.bvn || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">Account Number</p>
                                    <p className="font-mono text-sm font-bold text-gray-900">{selectedCapture.accountNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
