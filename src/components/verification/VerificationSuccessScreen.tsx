import { Shield, CheckCircle, AlertTriangle, User } from 'lucide-react';

interface VerificationSuccessScreenProps {
    matchResult: 'match' | 'no-match' | null;
    matchScore: number | null;
    officialMatchScore?: number | null;
    bvnMatchScore?: number | null;
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
    officialMatchScore,
    bvnMatchScore,
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

            {/* Comparison View - 3-Way Match */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-lg mb-8">
                {/* Official Photo */}
                <div className={`bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col items-center ${officialMatchScore !== null && officialMatchScore !== undefined && officialMatchScore < 0.5 ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase">Official</p>
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center relative">
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
                            <User className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                    {officialMatchScore !== null && officialMatchScore !== undefined && (
                        <p className={`text-[10px] mt-1 font-bold ${officialMatchScore < 0.5 ? 'text-green-600' : 'text-red-500'}`}>
                            {officialMatchScore < 0.5 ? 'Matched' : 'No Match'}
                            <span className="block font-normal text-gray-400">{(Math.exp(-officialMatchScore * 5) * 100).toFixed(0)}%</span>
                        </p>
                    )}
                </div>

                {/* Live Capture */}
                <div className="bg-white p-2 rounded-xl border-2 border-primary-100 flex flex-col items-center shadow-md transform scale-105 z-10">
                    <p className="text-[10px] font-bold text-primary-600 mb-2 uppercase">Live Capture</p>
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-sm flex items-center justify-center">
                        {capturedImage ? (
                            <img src={capturedImage} alt="Captured" className="h-full w-full object-cover scale-125" />
                        ) : (
                            <User className="h-10 w-10 text-gray-400" />
                        )}
                    </div>
                    <p className="text-[10px] text-center mt-2 font-bold text-green-600">
                        Live Verified
                    </p>
                </div>

                {/* BVN Photo */}
                <div className={`bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col items-center ${bvnMatchScore !== null && bvnMatchScore !== undefined && bvnMatchScore < 0.5 ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                    <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase">BVN Record</p>
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center relative">
                        <img
                            src={`https://rivers.thesmartapps.org/bvn-images/bvn-image-${employeeData?.employee_no || employeeData?.employment_number}.jpg`}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                            }}
                            alt="BVN"
                            className="h-full w-full object-cover"
                        />
                        <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center bg-gray-200">
                            <User className="h-8 w-8 text-gray-400 opacity-30" />
                        </div>
                    </div>
                    {bvnMatchScore !== null && bvnMatchScore !== undefined && (
                        <p className={`text-[10px] mt-1 font-bold ${bvnMatchScore < 0.5 ? 'text-green-600' : 'text-red-500'}`}>
                            {bvnMatchScore < 0.5 ? 'Matched' : 'No Match'}
                            <span className="block font-normal text-gray-400">{(Math.exp(-bvnMatchScore * 5) * 100).toFixed(0)}%</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col w-full max-w-xs gap-3">
                {!matchResult || matchResult === 'no-match' ? (
                    <>
                        <button
                            onClick={onMatch}
                            disabled={isMatching || isSubmitting || !modelsLoaded}
                            className={`w-full inline-flex items-center justify-center px-6 py-3 font-semibold text-white rounded-lg shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${matchResult === 'no-match' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary-600 hover:bg-primary-700'}`}
                        >
                            {isMatching ? (
                                <>
                                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Verifying & Submitting...
                                </>
                            ) : isSubmitting ? (
                                <>
                                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Submitting Result...
                                </>
                            ) : !modelsLoaded ? (
                                <>
                                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Loading Resources...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-5 w-5" />
                                    Submit Verification
                                </>
                            )}
                        </button>

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
