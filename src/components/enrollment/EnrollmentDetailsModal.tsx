import { useState } from 'react';
import { X, FileText, User, Fingerprint, History } from 'lucide-react';
// import api from '../../lib/api';

interface Enrollment {
  _id: string;
  fullname: string;
  department: string;
  employeeId: string;
  status: string;
  createdAt: string;
  serviceId?: string;
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

interface EnrollmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: Enrollment | null;
  onUpdateStatus: (id: string, status: string) => void;
}

export function EnrollmentDetailsModal({ isOpen, onClose, enrollment }: EnrollmentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'audit'>('overview');

  if (!isOpen || !enrollment) return null;

  const getFileUrl = (path?: string) => {
    if (!path) return '';

    // Already a full URL
    if (/^https?:\/\//i.test(path)) return path;

    let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7001';
    baseUrl = baseUrl.replace(/\/api\/?$/, '');

    // Normalize slashes and remove leading slash
    const cleanPath = path
      .replace(/\\/g, '/')  
      .replace(/^public\//, '') 
      .replace(/^\/+/, '');

    return `${baseUrl}/${cleanPath}`;
  };



  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl mr-4">
                  {enrollment.fullname.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {enrollment.fullname}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ID: {enrollment.employeeId} • {enrollment.department}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="mt-6 flex space-x-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 px-1 text-sm font-medium border-b-2 ${
                        activeTab === 'overview'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('documents')}
                    className={`pb-4 px-1 text-sm font-medium border-b-2 ${
                        activeTab === 'documents'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Documents ({enrollment.documents?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`pb-4 px-1 text-sm font-medium border-b-2 ${
                        activeTab === 'audit'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Audit Trail
                </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Personal Information</h4>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Full Name</span>
                                    <span className="text-sm font-medium text-gray-900">{enrollment.fullname}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Employee ID</span>
                                    <span className="text-sm font-medium text-gray-900">{enrollment.employeeId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Department</span>
                                    <span className="text-sm font-medium text-gray-900">{enrollment.department}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Service ID</span>
                                    <span className="text-sm font-medium text-gray-900">{enrollment.serviceId || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Enrollment Date</span>
                                    <span className="text-sm font-medium text-gray-900">{new Date(enrollment.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Biometrics Status</h4>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <User className="h-5 w-5 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-700">Facial Capture</span>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        enrollment.biometrics?.images?.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {enrollment.biometrics?.images?.length || 0} Images
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Fingerprint className="h-5 w-5 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-700">Fingerprints</span>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        enrollment.biometrics?.fingerprints?.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {enrollment.biometrics?.fingerprints?.length || 0} Captured
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Images Preview */}
                    {enrollment.biometrics?.images?.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Captured Images</h4>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {enrollment.biometrics.images.map((img, idx) => (
                                    <img 
                                        key={idx} 
                                        src={getFileUrl(img)} 
                                        alt={`Capture ${idx + 1}`} 
                                        className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'documents' && (
                <div className="space-y-4">
                    {enrollment.documents && enrollment.documents.length > 0 ? (
                        enrollment.documents.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center">
                                    <FileText className="h-8 w-8 text-primary-500 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{doc.type || `Document ${idx + 1}`}</p>
                                        <p className="text-xs text-gray-500">Uploaded on {new Date(enrollment.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <a 
                                    href={getFileUrl(doc.uri)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    View
                                </a>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No documents uploaded</p>
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
                                            <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                                <History className="h-4 w-4 text-gray-500" />
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    {event.action} <span className="font-medium text-gray-900">by {event.performedBy}</span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">{event.details}</p>
                                            </div>
                                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
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

          {/* Footer Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {/* {enrollment.status === 'pending' || enrollment.status === 'rejected' ? (
                 <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleStatusUpdate('verified')}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                    {processing ? 'Processing...' : 'Verify Enrollment'}
                </button>
            ) : null}
            
            {enrollment.status === 'pending' || enrollment.status === 'verified' ? (
                <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleStatusUpdate('rejected')}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                    {processing ? 'Processing...' : 'Reject'}
                </button>
            ) : null} */}

            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
