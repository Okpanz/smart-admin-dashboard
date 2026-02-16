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

    useEffect(() => {
        fetchCaptures();
    }, []);

    const fetchCaptures = async () => {
        setIsLoading(true);
        try {
            const baseUrl = (import.meta as { env: { [key: string]: string } }).env.VITE_VERIFICATION_API_BASE_URL || 'https://i-am-alive-server.onrender.com';
            const url = `${baseUrl.replace(/\/$/, '')}/i-am-alive/captures`;
            const response = await axios.get<ApiResponse>(url);
            if (response.data.success) {
                setCaptures(response.data.data);
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

    const filteredCaptures = captures.filter(c =>
        c.employeeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getImageUrl = (path: string) => {
        if (path.startsWith('http')) return path;
        // Assuming the server serves uploads statically or we need a base URL
        const baseUrl = (import.meta as { env: { [key: string]: string } }).env.VITE_VERIFICATION_API_BASE_URL || 'https://i-am-alive-server.onrender.com';
        return `${baseUrl.replace(/\/$/, '')}/${path}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Liveness Verification Report</h1>
                    <p className="text-gray-500">View history of identity verification attempts.</p>
                </div>
                <button
                    onClick={fetchCaptures}
                    className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                    title="Refresh Data"
                >
                    <Loader2 className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className="relative flex-1 max-w-md">
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
                            ) : filteredCaptures.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCaptures.map((capture) => (
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
            </div>

            {/* Details Modal */}
            {selectedCapture && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">Verification Details</h2>
                            <button
                                onClick={() => setSelectedCapture(null)}
                                className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Captured Live Image</h3>
                                    <div className="aspect-[4/5] bg-black rounded-xl overflow-hidden shadow-md ring-1 ring-gray-200">
                                        <img
                                            src={getImageUrl(selectedCapture.imagePath)}
                                            alt="Captured"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="mt-2 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${selectedCapture.imageMatch === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {selectedCapture.imageMatch === 1 ? 'Match Verified' : 'No Match Detected'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Verification Data</h3>
                                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-500">Employee Name</p>
                                            <p className="font-semibold text-gray-900">{selectedCapture.firstName} {selectedCapture.lastName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Employee Number</p>
                                            <p className="font-mono text-gray-700">{selectedCapture.employeeNo}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Service ID</p>
                                            <p className="font-mono text-gray-700">{selectedCapture.serviceId}</p>
                                        </div>
                                        <div className="pt-2 border-t border-gray-200">
                                            <p className="text-xs text-gray-500">Capture Time</p>
                                            <p className="text-sm text-gray-700">{format(new Date(selectedCapture.capturedAt))}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Confidence Score</p>
                                            <p className="text-sm font-mono font-bold text-primary-600">{selectedCapture.confidenceLevel}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">BVN</p>
                                    <p className="font-mono text-gray-900">{selectedCapture.bvn || 'N/A'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Account Number</p>
                                    <p className="font-mono text-gray-900">{selectedCapture.accountNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
