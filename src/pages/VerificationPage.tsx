import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, CheckCircle, AlertCircle, Shield, User, CreditCard, Building2, Phone, Mail, FileText, RefreshCw } from 'lucide-react';
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
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [manualBvn, setManualBvn] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<VerificationData | null>(null);
    const [officialImageLoaded, setOfficialImageLoaded] = useState(false);
    const [bvnImageLoaded, setBvnImageLoaded] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const input = employeeNo.trim();
        if (!input) return;

        setIsLoading(true);
        setError(null);
        setData(null);
        setManualBvn(''); // Reset manual BVN on new search
        setOfficialImageLoaded(false);
        setBvnImageLoaded(false);

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
            // Get the first key and value from params
            const [key, value] = Object.entries(params)[0];

            // In dev, use a relative URL so the Vite proxy handles CORS.
            // In production, use the env var or fall back to the direct URL.
            const url = import.meta.env.DEV
                ? `/pensionaire/verify?${key}=${encodeURIComponent(value)}`
                : `${(import.meta.env.VITE_VERIFICATION_API_BASE_URL || 'https://smart-verify-server.onrender.com').replace(/\/$/, '')}/pensionaire/verify?${key}=${encodeURIComponent(value)}`;

            console.group('Verification Request Debug');
            console.log('Mode:', import.meta.env.DEV ? 'DEV (proxy)' : 'PROD (direct)');
            console.log('Final URL:', url);
            console.log('Params:', { key, value });
            console.groupEnd();

            const response = await axios.get(url);
            console.log('Verification API Response:', response.data);

            const apiData = response.data;
            if (apiData && apiData.data && apiData.data.status && apiData.data.data) {
                setData(apiData.data.data);
            } else {
                setError(apiData?.message || 'Verification failed. Please check your details.');
            }
        } catch (err: any) {
            console.error('Verification error:', err);
            // A Network Error (no response) typically means the proxy couldn't reach
            // the upstream server — often a cold-start on Render.com free tier.
            if (err?.code === 'ERR_NETWORK' || !err?.response) {
                setError('Network error: could not reach the verification server. The server may be starting up — please wait 30 seconds and try again.');
            } else {
                setError(err?.response?.data?.message || 'Unable to verify. Please try again later or check your connection.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleProceed = () => {
        // Navigate to liveness check with the verified data
        if (data) {
            const finalBvn = data.bvn || manualBvn;

            if (!finalBvn) {
                setError("Please enter your BVN to proceed.");
                return;
            }

            // Simple BVN validation
            if (finalBvn.length !== 11 || !/^\d+$/.test(finalBvn)) {
                setError("Please enter a valid 11-digit BVN.");
                return;
            }

            navigate('/liveness-check', {
                state: {
                    employeeData: {
                        ...data,
                        phone,
                        email,
                        bvn: finalBvn
                    }
                }
            });
        }
    };

    const getFullName = () => {
        if (!data) return '';
        return [data.surname, data.first_name, data.middle_name].filter(Boolean).join(' ');
    };

    const isBvnRequired = data && !data.bvn;

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
                <div className="w-full max-w-2xl lg:max-w-4xl">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Identity Verification</h1>
                        <p className="text-gray-600">Enter your details and any missing information to verify your identity.</p>
                    </div>

                    {/* Verification Form */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div className="p-8">
                            <form onSubmit={handleVerify}>
                                <div className="space-y-6"> {/* Added space-y-6 for spacing between inputs */}
                                    <div>
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
                                                disabled={isLoading || !!data} // Disable if verification successful (can clear to reset)
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Phone className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    required
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                                    placeholder="08012345678"
                                                    disabled={isLoading || !!data}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address <span className="text-gray-400 text-xs">(Optional)</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Mail className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                                    placeholder="you@example.com"
                                                    disabled={isLoading || !!data}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!data && (
                                    <button
                                        type="submit"
                                        disabled={isLoading || !employeeNo.trim() || !phone.trim()}
                                        className="w-full mt-8 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
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
                                )}
                            </form>

                            {/* Reset Button if Data exists */}
                            {data && (
                                <button
                                    onClick={() => {
                                        setData(null);
                                        setEmployeeNo('');
                                        setPhone('');
                                        setEmail('');
                                        setManualBvn('');
                                        setError(null);
                                        setOfficialImageLoaded(false);
                                        setBvnImageLoaded(false);
                                    }}
                                    className="w-full mt-4 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                                >
                                    Start Over
                                </button>
                            )}
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

                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Side: Identity & Details (Spans 2 columns) */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Identity Header */}
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-gray-100 pb-6">
                                            <div className="flex-shrink-0">
                                                <div className="h-32 w-32 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                                                    <img
                                                        src={`${import.meta.env.DEV ? '/images' : 'https://rivers.thesmartapps.org/images'}/${data.employee_no || data.employment_number}.png`}
                                                        onLoad={() => setOfficialImageLoaded(true)}
                                                        onError={(e) => {
                                                            setOfficialImageLoaded(false);
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                        alt="Profile"
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <User className="h-16 w-16 text-gray-400 hidden" />
                                                </div>
                                            </div>
                                            <div className="text-center sm:text-left flex-1 py-2">
                                                <p className="text-sm text-gray-500 uppercase tracking-wide font-bold mb-1">Employee Name</p>
                                                <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">{getFullName()}</h2>
                                                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Verified
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="h-4 w-4 text-primary-500" />
                                                    <p className="text-xs text-gray-500 font-medium uppercase">Employee No</p>
                                                </div>
                                                <p className="font-bold text-gray-900 text-lg truncate" title={data.employment_number || data.employee_no}>
                                                    {data.employment_number || data.employee_no || 'N/A'}
                                                </p>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Phone className="h-4 w-4 text-primary-500" />
                                                    <p className="text-xs text-gray-500 font-medium uppercase">Phone Number</p>
                                                </div>
                                                <p className="font-bold text-gray-900 text-lg">{phone || 'N/A'}</p>
                                            </div>

                                            {/* BVN Display or Input */}
                                            <div className={`bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors sm:col-span-2 ${isBvnRequired ? 'border-2 border-orange-200 bg-orange-50' : ''}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Building2 className="h-4 w-4 text-primary-500" />
                                                    <p className="text-xs text-gray-500 font-medium uppercase">BVN {isBvnRequired && '(Required)'}</p>
                                                </div>
                                                {data.bvn ? (
                                                    <p className="font-bold text-gray-900 text-lg tracking-wide">{data.bvn}</p>
                                                ) : (
                                                    <div className="mt-2">
                                                        <label htmlFor="manualBvn" className="sr-only">Enter BVN</label>
                                                        <input
                                                            type="text"
                                                            id="manualBvn"
                                                            value={manualBvn}
                                                            onChange={(e) => setManualBvn(e.target.value)}
                                                            placeholder="Enter 11-digit BVN"
                                                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-lg"
                                                            maxLength={11}
                                                        />
                                                        <p className="text-xs text-orange-600 mt-1 font-medium">Please enter your BVN to proceed.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors sm:col-span-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CreditCard className="h-4 w-4 text-primary-500" />
                                                    <p className="text-xs text-gray-500 font-medium uppercase">Account Details</p>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="font-bold text-gray-900 text-lg tracking-wide">{data.account_number}</p>
                                                    <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600 font-medium shadow-sm">
                                                        {data.account_type || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Evidence (BVN Image) */}
                                    <div className="lg:col-span-1">
                                        <div className="bg-gray-50 rounded-2xl p-4 h-full flex flex-col border border-gray-100">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className="h-4 w-4 text-gray-500" />
                                                <p className="text-xs text-gray-500 font-bold uppercase">BVN Record Image</p>
                                            </div>
                                            <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center min-h-[300px] shadow-sm relative group">
                                                {/* Uses either 'employee_no' or 'employment_number', prioritizing likely source */}
                                                <img
                                                    src={import.meta.env.DEV
                                                        ? `/bvn-images/bvn-image-${data.employee_no || data.employment_number}.jpg`
                                                        : `https://rivers.thesmartapps.org/bvn-images/bvn-image-${data.employee_no || data.employment_number}.jpg`
                                                    }
                                                    onLoad={() => setBvnImageLoaded(true)}
                                                    onError={(e) => {
                                                        setBvnImageLoaded(false);
                                                        // Hide image on error and show placeholder
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                    alt="BVN Record"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="hidden flex flex-col items-center justify-center text-gray-400 p-4 text-center absolute inset-0 bg-gray-50">
                                                    <User className="h-16 w-16 mb-2 opacity-20" />
                                                    <span className="text-sm font-medium">Image not available</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isBvnRequired ? (
                                    <button
                                        onClick={async () => {
                                            if (!manualBvn || manualBvn.length !== 11) {
                                                setError("Please enter a valid 11-digit BVN to update.");
                                                return;
                                            }

                                            setIsLoading(true);
                                            setError(null);

                                            try {
                                                const updateUrl = import.meta.env.DEV
                                                    ? '/api/v1/update-employee-or-pensioner-bvn'
                                                    : 'https://rivers.thesmartapps.org/api/v1/update-employee-or-pensioner-bvn';
                                                const payload = {
                                                    employee_no: data.employee_no || data.employment_number,
                                                    type: 'pension',
                                                    bvn: manualBvn
                                                };

                                                await axios.post(updateUrl, payload);

                                                // On success, re-verify to get updated data
                                                // We can reuse the existing handleVerify logic but we need to trigger it manually
                                                // Or just simpler: clear data and re-run the fetch for the current ID

                                                // Trigger a refresh by simulating the verify call or just overriding local state if we trust the update?
                                                // Better to re-fetch to be safe and consistent

                                                // Re-construct the params for re-verification
                                                const id = data.employee_no || data.employment_number;
                                                // We know we are searching by ID at this point usually
                                                const verifyUrl = import.meta.env.DEV
                                                    ? `/pensionaire/verify?employee_no=${encodeURIComponent(id || '')}`
                                                    : `${(import.meta.env.VITE_VERIFICATION_API_BASE_URL || 'https://i-am-alive-sever.onrender.com').replace(/\/$/, '')}/pensionaire/verify?employee_no=${encodeURIComponent(id || '')}`;

                                                const response = await axios.get(verifyUrl);
                                                const apiData = response.data;

                                                if (apiData && apiData.data && apiData.data.status && apiData.data.data) {
                                                    setData(apiData.data.data);
                                                    setManualBvn(''); // Clear manual input
                                                    // Success! The UI will now show 'Proceed' because isBvnRequired will be false
                                                } else {
                                                    setError('BVN Updated, but failed to refresh record. Please search again.');
                                                }

                                            } catch (err) {
                                                console.error('BVN Update Error:', err);
                                                setError('Failed to update BVN. Please try again.');
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        }}
                                        disabled={isLoading}
                                        className="w-full mt-8 flex justify-center items-center py-4 px-6 border border-transparent rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Updating...' : 'Update BVN Record & Reload'}
                                        <RefreshCw className={`ml-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleProceed}
                                            disabled={!officialImageLoaded && !bvnImageLoaded}
                                            className="w-full mt-8 flex justify-center items-center py-4 px-6 border border-transparent rounded-xl text-base font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {(officialImageLoaded || bvnImageLoaded) ? 'Proceed to Facial Verification' : 'Facial Verification Disabled'}
                                            <Shield className="ml-2 h-5 w-5" />
                                        </button>
                                        {!officialImageLoaded && !bvnImageLoaded && (
                                            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex items-center gap-3">
                                                <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                                                <p className="text-xs text-orange-800 font-medium">
                                                    Facial verification is unavailable because no reference images (Official or BVN) were found for this pensioner.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
