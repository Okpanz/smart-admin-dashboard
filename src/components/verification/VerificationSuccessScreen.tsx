import { Shield, CheckCircle, AlertTriangle, User } from 'lucide-react';

interface VerificationSuccessScreenProps {
    matchResult: 'match' | 'no-match' | null;
    matchScore: number | null;
    capturedImage: string | null;
    employeeData: any;
    error: string | null;
    isMatching: boolean;
    isSubmitting: boolean;
    modelsLoaded: boolean;
    onMatch: () => void;
    onSubmit: () => void;
    onRestart: () => void;
}

export const VerificationSuccessScreen = ({
    matchResult,
    matchScore,
    capturedImage,
    employeeData,
    error,
    isMatching,
    isSubmitting,
    modelsLoaded,
    onMatch,
    onSubmit,
    onRestart
}: VerificationSuccessScreenProps) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
            <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full mb-4 ${matchResult === 'no-match' ? 'bg-red-100' : 'bg-green-100'}`}>
                {matchResult === 'no-match' ? (
                    <Shield className="h-10 w-10 text-red-600" />
                ) : (
                    <CheckCircle className="h-10 w-10 text-green-600" />
                )}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${matchResult === 'no-match' ? 'text-red-600' : 'text-green-600'}`}>
                {matchResult === 'match' ? 'Identity Verified!' : matchResult === 'no-match' ? 'Verification Failed' : 'Verification Complete!'}
            </h2>
            <p className="text-gray-600 mb-2">
                {matchResult === 'match'
                    ? 'Facial match confirmed. You can now proceed.'
                    : matchResult === 'no-match'
                        ? 'The captured face does not match the official record.'
                        : 'Liveness check passed. Proceed to facial matching.'}
            </p>

            {matchScore !== null && (
                <p className="text-xs text-gray-500 mb-4 font-mono bg-gray-100 p-2 rounded inline-block">
                    Confidence: {(Math.exp(-matchScore * 5) * 100).toFixed(2)}% (Distance: {matchScore.toFixed(4)})
                </p>
            )}

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 max-w-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Comparison View */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col items-center">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Official Photo</p>
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center relative">
                        <img
                            src={`https://rivers.thesmartapps.org/images/${employeeData?.employee_no || employeeData?.employment_number}.png`}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                            }}
                            alt="Official"
                            className="h-full w-full object-cover"
                        />
                        <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center bg-gray-200">
                            <User className="h-10 w-10 text-gray-400" />
                        </div>
                    </div>
                    <p className="text-xs text-center mt-2 font-medium text-gray-900 line-clamp-1">
                        {employeeData ? [employeeData.surname, employeeData.first_name].join(' ') : 'Unknown User'}
                    </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col items-center">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Live Capture</p>
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center">
                        {capturedImage ? (
                            <img src={capturedImage} alt="Captured" className="h-full w-full object-cover scale-125" />
                        ) : (
                            <User className="h-10 w-10 text-gray-400" />
                        )}
                    </div>
                    <p className="text-xs text-center mt-2 font-medium text-green-600">
                        Live Verified
                    </p>
                </div>
            </div>

            <div className="flex flex-col w-full max-w-xs gap-3">
                {!matchResult || matchResult === 'no-match' ? (
                    <>
                        <button
                            onClick={onMatch}
                            disabled={isMatching || !modelsLoaded}
                            className="w-full inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isMatching ? (
                                <>
                                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Verifying Identity...
                                </>
                            ) : !modelsLoaded ? (
                                <>
                                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Loading Resources...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-5 w-5" />
                                    {matchResult === 'no-match' ? 'Retry Verification' : 'Verify Identity'}
                                </>
                            )}
                        </button>

                        {matchResult === 'no-match' && (
                            <button
                                onClick={onSubmit}
                                disabled={isSubmitting}
                                className="w-full inline-flex items-center justify-center px-6 py-3 font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin mr-2 h-5 w-5 border-2 border-amber-700 border-t-transparent rounded-full"></div>
                                        Submitting...
                                    </>
                                ) : 'Submit Anyway'}
                            </button>
                        )}

                        <button
                            onClick={onRestart}
                            disabled={isMatching || isSubmitting}
                            className="w-full inline-flex items-center justify-center px-6 py-3 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg active:scale-95 transition-all disabled:opacity-50"
                        >
                            Restart
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className="w-full inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Finish
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
