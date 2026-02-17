import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, CheckCircle, AlertCircle, Shield, User, CreditCard, Hash, Building2 } from 'lucide-react';
import axios from 'axios';

interface VerificationData {
    /*
        The API returns this as `idemp_info`.
        We map it to `emp_info_id` in the submission payload.
    */
    idemp_info?: string | number;

    // Legacy/Incorrect fields (removing/deprecating)
    id?: string;
    emp_info_id?: string;

    surname: string;
    first_name: string;
    middle_name: string;
    service_id: string;
    employment_number?: string;
    employee_no?: string;
    account_number: string;
    account_type: string;
    bvn: string;
    photo_url: string | null;
}

export function VerificationPage() {
    const navigate = useNavigate();
    const [employeeNo, setEmployeeNo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<VerificationData | null>(null);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const input = employeeNo.trim();
        if (!input) return;

        setIsLoading(true);
        setError(null);
        setData(null);

        // Smart detection of input type
        let params: Record<string, string> = {};
        if (/^\d{11}$/.test(input)) {
            params = { employee_no: input };
        } else if (/^\d{10}$/.test(input)) {
            params = { employee_no: input };
        } else {
            params = { employee_no: input };
        }

        try {
            const employeeNoParam = params.employee_no;
            const baseUrl = import.meta.env.DEV ? '' : 'https://i-am-alive-server.onrender.com';
            const url = `${baseUrl}/pensionaire/verify?employee_no=${encodeURIComponent(employeeNoParam)}`;

            const response = await axios.get(url);
            console.log('Verification API Response:', response.data);

            const apiData = response.data;
            if (apiData && apiData.data && apiData.data.status && apiData.data.data) {
                setData(apiData.data.data);
            } else {
                setError(apiData?.message || 'Verification failed. Please check your details.');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError('Unable to verify. Please try again later or check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProceed = () => {
        // Navigate to liveness check with the verified data
        if (data) {
            navigate('/liveness-check', { state: { employeeData: data } });
        }
    };

    const getFullName = () => {
        if (!data) return '';
        return [data.surname, data.first_name, data.middle_name].filter(Boolean).join(' ');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary-50 p-2 rounded-lg">
                            <Shield className="h-6 w-6 text-primary-600" />
                        </div>
                        <span className="font-bold text-xl text-gray-900">SmartVerify</span>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-500 hover:text-gray-900 text-sm font-medium"
                    >
                        Back to Home
                    </button>
                </div>
            </div>

            <main className="flex-1 flex flex-col items-center justify-center p-4 py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Identity Verification</h1>
                        <p className="text-gray-600">Enter your details to verify your identity before proceeding.</p>
                    </div>

                    {/* Verification Form */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div className="p-8">
                            <form onSubmit={handleVerify}>
                                <div className="mb-6">
                                    <label htmlFor="employeeNo" className="block text-sm font-medium text-gray-700 mb-2">
                                        Employee No / BVN / Account No
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="employeeNo"
                                            value={employeeNo}
                                            onChange={(e) => setEmployeeNo(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                            placeholder="Enter ID, BVN, or Account Number"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !employeeNo.trim()}
                                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify Identity'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-4">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Results Card */}
                    {data && (
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8">
                            <div className="bg-green-50 border-b border-green-100 p-4 flex items-center gap-3">
                                <div className="bg-green-100 p-1.5 rounded-full">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <h3 className="font-bold text-green-800">Identity Verified</h3>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                                        <img
                                            src={`${import.meta.env.DEV ? '/images' : 'https://rivers.thesmartapps.org/images'}/${data.employee_no || data.employment_number}.png`}
                                            onError={(e) => {
                                                // Fallback to placeholder if image fails
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                        <User className="h-8 w-8 text-gray-400 hidden" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">Employee Name</p>
                                        <p className="text-lg font-bold text-gray-900">{getFullName()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="h-3.5 w-3.5 text-gray-400" />
                                            <p className="text-xs text-gray-500 font-medium uppercase">Employee No</p>
                                        </div>
                                        <p className="font-semibold text-gray-900 truncate" title={data.employment_number || data.employee_no}>
                                            {data.employment_number || data.employee_no || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Hash className="h-3.5 w-3.5 text-gray-400" />
                                            <p className="text-xs text-gray-500 font-medium uppercase">Service ID</p>
                                        </div>
                                        <p className="font-semibold text-gray-900">{data.service_id}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                            <p className="text-xs text-gray-500 font-medium uppercase">BVN</p>
                                        </div>
                                        <p className="font-semibold text-gray-900">{data.bvn || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                                            <p className="text-xs text-gray-500 font-medium uppercase">Account Details</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-gray-900">{data.account_number}</p>
                                            <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium">
                                                {data.account_type || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleProceed}
                                    className="w-full mt-4 flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/40"
                                >
                                    Proceed to Facial Verification
                                    <Shield className="ml-2 h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
