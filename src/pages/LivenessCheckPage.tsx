import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LivenessCheck } from '../components/LivenessCheck';
import { Shield, CheckCircle, ArrowLeft } from 'lucide-react';

export function LivenessCheckPage() {
    const navigate = useNavigate();
    const [isVerified, setIsVerified] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleComplete = (success: boolean) => {
        if (success) {
            setIsVerified(true);
            console.log('User verified as live!');
            // You can add additional logic here, such as:
            // - Storing verification status
            // - Redirecting to next step
            // - Sending verification to backend
        }
    };

    const handleError = (error: Error) => {
        console.error('Liveness check error:', error);
        setError(error.message || 'Unable to complete liveness check. Please check your camera permissions.');
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    const handleStartOver = () => {
        setIsVerified(false);
        setError(null);
    };

    return (
        <div className="h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
            {/* Header - Compact */}
            <div className="flex-none pt-4 pb-2 px-4 text-center z-10">
                <div className="inline-flex items-center justify-center p-2 rounded-full bg-primary-50 mb-2">
                    <Shield className="h-6 w-6 text-primary-600" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                    Face Liveness Verification
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                    Follow instructions to verify identity
                </p>
            </div>

            {/* Main Content - Grows */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-full">
                    {!isStarted ? (
                        // Start Screen
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
                                <Shield className="h-10 w-10 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Verify?</h2>
                            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                                We need to verify your identity. Perform a few simple head movements.
                                <br />
                                Please ensure you are in a well-lit area.
                            </p>
                            <button
                                onClick={() => setIsStarted(true)}
                                className="inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
                            >
                                Start Verification
                            </button>
                        </div>
                    ) : !isVerified && !error ? (
                        <div className="flex-1 overflow-y-auto w-full">
                            <LivenessCheck
                                onComplete={handleComplete}
                                onError={handleError}
                            />
                        </div>
                    ) : isVerified ? (
                        // Success State
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-green-600 mb-2">Verification Complete!</h2>
                            <p className="text-gray-600 mb-8">
                                Your identity has been successfully verified.
                            </p>
                            <div className="flex flex-col w-full max-w-xs gap-3">
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md active:scale-95 transition-all"
                                >
                                    <CheckCircle className="mr-2 h-5 w-5" />
                                    Submit
                                </button>
                                <button
                                    onClick={handleStartOver}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md active:scale-95 transition-all"
                                >
                                    Retry Check
                                </button>
                                <button
                                    onClick={handleBackToLogin}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg active:scale-95 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Error State
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                <Shield className="h-10 w-10 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
                            <p className="text-gray-600 mb-2 max-w-xs mx-auto">
                                {error}
                            </p>
                            <p className="text-gray-500 text-sm mb-8">
                                Please check camera permissions.
                            </p>
                            <div className="flex flex-col w-full max-w-xs gap-3">
                                <button
                                    onClick={handleStartOver}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md active:scale-95 transition-all"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={handleBackToLogin}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg active:scale-95 transition-all"
                                >
                                    <ArrowLeft className="mr-2 h-5 w-5" />
                                    Back to Login
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer - Copyright / Disclaimer */}
            <div className="flex-none p-4 text-center text-xs text-gray-400 z-10">
                <p>Protected by Smart Liveness Verification</p>
            </div>
        </div>
    );
}
