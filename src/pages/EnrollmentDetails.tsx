import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, User, Fingerprint, History } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Enrollment {
    _id: string;
    fullname: string;
    department: string;
    employeeId: string;
    status: string;
    createdAt: string;
    serviceId?: string;
    dob?: string;
    firstAppointmentDate?: string;
    biometrics: {
        images: string[];
        fingerprints: {
            path: string;
            type: string;
        }[];
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

export function EnrollmentDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [enrollment, setEnrollment] = useState<Enrollment | null>(
        location.state?.enrollment || null
    );
    const [loading, setLoading] = useState(!location.state?.enrollment);
    const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'audit'>('overview');
    const [processing, setProcessing] = useState(false);

    const normalizeStatus = (status?: string) => String(status || '').trim().toUpperCase();

    const refreshEnrollment = async () => {
        if (!enrollment?.employeeId) return;
        try {
            const res = await api.get('/mobile/v1/enrollments', { params: { page: 1, limit: 10, search: enrollment.employeeId } });
            const payload = res.data?.data || res.data;
            const list = Array.isArray(payload?.data) ? payload.data : payload?.data?.data;
            const found = Array.isArray(list)
                ? list.find((e: any) => String(e?._id) === String(id) || String(e?.employeeId) === String(enrollment.employeeId))
                : null;

            if (found) setEnrollment(found);
        } catch (error) {
            console.error('Failed to refresh enrollment:', error);
        }
    };

    useEffect(() => {
        if (!enrollment) {
            toast.error('Enrollment details not found. Please select from the list.');
            navigate('/enrollments', { replace: true });
        } else {
            setLoading(false);
        }
    }, [enrollment, navigate]);

    const handleStatusUpdate = async (status: 'VERIFIED' | 'rejected') => {
        try {
            setProcessing(true);
            await api.patch(`/mobile/v1/enrollments/${id}/status`, { status });
            toast.success(`Enrollment ${status === 'VERIFIED' ? 'verified' : status} successfully`);
            if (enrollment) {
                setEnrollment({ ...enrollment, status });
            }
            await refreshEnrollment();
        } catch (error) {
            console.error(`Failed to update status to ${status}:`, error);
            toast.error('Failed to update status. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const getFileUrl = (path?: string) => {
        if (!path) return '';
        if (/^https?:\/\//i.test(path)) return path;

        let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7001';
        baseUrl = baseUrl.replace(/\/api\/?$/, '');

        const cleanPath = path
            .replace(/\\/g, '/')
            .replace(/^public\//, '')
            .replace(/^\/+/, '');

        return `${baseUrl}/${cleanPath}`;
    };

    const getStatusDisplay = () => {
        if (!enrollment) return { label: '', classes: '' };

        const s = normalizeStatus(enrollment.status);

        if (s === 'REJECTED') {
            return {
                label: 'Rejected',
                classes: 'bg-red-100 text-red-700 border border-red-200'
            };
        }

        if (s === 'VERIFIED' || s === 'ENROLLED') {
            return {
                label: 'Verified',
                classes: 'bg-green-100 text-green-700 border border-green-200'
            };
        }

        return {
            label: 'Unverified',
            classes: 'bg-yellow-100 text-yellow-700 border border-yellow-200'
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!enrollment) return null;

    const formatDateSafe = (v?: string) => {
        if (!v) return 'N/A';
        const d = new Date(v);
        return isNaN(d.getTime()) ? v : d.toLocaleDateString();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header & Back Navigation */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl mr-4">
                            {enrollment.fullname.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{enrollment.fullname}</h1>
                            <p className="text-sm text-gray-500">
                                ID: {enrollment.employeeId} • {enrollment.department}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Top-Level Actions (Verify / Reject) */}
                <div className="flex items-center space-x-4">
                    {(() => {
                        const { label, classes } = getStatusDisplay();
                        return (
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-400 uppercase font-bold mb-1">Current Status</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classes}`}>
                                    {label}
                                </span>
                            </div>
                        );
                    })()}

                    <div className="h-10 w-px bg-gray-200 mx-2"></div>

                    {(() => {
                        const s = normalizeStatus(enrollment.status);
                        return (s !== 'VERIFIED' && s !== 'ENROLLED' && s !== 'REJECTED');
                    })() && (
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => handleStatusUpdate('rejected')}
                                className="inline-flex justify-center rounded-xl border border-red-200 px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm shadow-sm transition-all disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Reject'}
                            </button>

                            <button
                                type="button"
                             
                               
                                onClick={() => handleStatusUpdate('VERIFIED')}
                                className="inline-flex justify-center rounded-xl border border-transparent shadow-lg px-8 py-2.5 bg-green-600 font-black text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                            >
                                {processing ? 'Processing...' : 'Verify Enrollment'}
                            </button>
                        </div>
                    )}
                </div>
            </div>



            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                            ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'documents'
                            ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Documents ({enrollment.documents?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'audit'
                            ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Audit Trail
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Biometric Gallery (Side-by-Side Grid) */}
                            {(enrollment.biometrics?.images?.length > 0 || enrollment.biometrics?.fingerprints?.length > 0) && (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    {/* Images Preview */}
                                    {enrollment.biometrics?.images?.length > 0 && (
                                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                                <User className="h-4 w-4 mr-2" />
                                                Captured Images
                                            </h4>
                                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                                {enrollment.biometrics.images.map((img, idx) => (
                                                    <div key={idx} className="relative group flex-shrink-0">
                                                        <img
                                                            src={getFileUrl(img)}
                                                            alt={`Capture ${idx + 1}`}
                                                            className="h-40 w-40 object-cover rounded-xl border-2 border-gray-50 shadow-sm transition-transform group-hover:scale-105"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fingerprints Preview */}
                                    {enrollment.biometrics?.fingerprints?.length > 0 && (
                                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                                <Fingerprint className="h-4 w-4 mr-2" />
                                                Captured Fingerprints
                                            </h4>
                                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                                {enrollment.biometrics.fingerprints.map((fp, idx) => (
                                                    <div key={idx} className="relative group flex-shrink-0">
                                                        <div className="relative">
                                                            <img
                                                                src={getFileUrl(fp.path)}
                                                                alt={fp.type || `Fingerprint ${idx + 1}`}
                                                                className="h-40 w-40 object-contain bg-gray-50 rounded-xl border-2 border-gray-50 shadow-sm transition-transform group-hover:scale-105 p-3"
                                                            />
                                                            <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-center uppercase tracking-wider">
                                                                {fp.type || 'Unknown'}
                                                            </div>
                                                        </div>
                                                        <p className="text-[9px] font-bold text-gray-400 mt-2 text-center uppercase tracking-widest">{fp.type || `Finger ${idx + 1}`}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Basic Info Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Personal Information</h4>
                                    <div className="bg-gray-50/50 rounded-xl p-5 space-y-4 border border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Full Name</span>
                                            <span className="text-sm font-medium text-gray-900">{enrollment.fullname}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Employee ID</span>
                                            <span className="text-sm font-medium text-gray-900">{enrollment.employeeId}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">DOB</span>
                                            <span className="text-sm font-medium text-gray-900">{formatDateSafe(enrollment.dob)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Date Of First Appointment</span>
                                            <span className="text-sm font-medium text-gray-900">{formatDateSafe(enrollment.firstAppointmentDate)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Department</span>
                                            <span className="text-sm font-medium text-gray-900">{enrollment.department}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Service ID</span>
                                            <span className="text-sm font-medium text-gray-900">{enrollment.serviceId || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Enrollment Date</span>
                                            <span className="text-sm font-medium text-gray-900">{new Date(enrollment.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Biometrics Status</h4>
                                    <div className="bg-gray-50/50 rounded-xl p-5 space-y-4 border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                                                    <User className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">Facial Capture</span>
                                            </div>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${enrollment.biometrics?.images?.length > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {enrollment.biometrics?.images?.length || 0} Images
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                                                    <Fingerprint className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">Fingerprints</span>
                                            </div>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${enrollment.biometrics?.fingerprints?.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {enrollment.biometrics?.fingerprints?.length || 0} Captured
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {enrollment.documents && enrollment.documents.length > 0 ? (
                                enrollment.documents.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
                                        <div className="flex items-center">
                                            <div className="p-3 bg-primary-50 text-primary-600 rounded-lg mr-4">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{doc.type || `Document ${idx + 1}`}</p>
                                                <p className="text-xs text-gray-500 mt-1">Uploaded {new Date(enrollment.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={getFileUrl(doc.uri)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                                        >
                                            View
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-gray-500 font-medium">No documents uploaded</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="flow-root">
                            <ul className="-mb-8">
                                {enrollment.auditTrail?.map((event, eventIdx) => (
                                    <li key={eventIdx}>
                                        <div className="relative pb-8">
                                            {eventIdx !== enrollment.auditTrail.length - 1 ? (
                                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                            ) : null}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className="h-8 w-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center ring-8 ring-white">
                                                        <History className="h-4 w-4 text-gray-400" />
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4 bg-white rounded-lg p-3 border border-gray-100 shadow-sm ml-2">
                                                    <div>
                                                        <p className="text-sm text-gray-500">
                                                            {event.action} <span className="font-medium text-gray-900">by {event.performedBy}</span>
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">{event.details}</p>
                                                    </div>
                                                    <div className="text-right text-sm whitespace-nowrap text-gray-400">
                                                        <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleString()}</time>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
