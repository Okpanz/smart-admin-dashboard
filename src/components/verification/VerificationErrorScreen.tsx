import { Shield, ArrowLeft } from 'lucide-react';

interface VerificationErrorScreenProps {
    error: string | null;
    onRetry: () => void;
    onBackToLogin: () => void;
}

export const VerificationErrorScreen = ({ error, onRetry, onBackToLogin }: VerificationErrorScreenProps) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <Shield className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-2 max-w-xs mx-auto">
                {error}
            </p>
            {error && (
                error.toLowerCase().includes('camera') ||
                error.toLowerCase().includes('permission') ||
                error.toLowerCase().includes('media') ||
                error.toLowerCase().includes('device')
            ) && (
                    <p className="text-gray-500 text-sm mb-8">
                        Please check camera permissions.
                    </p>
                )}
            <div className="flex flex-col w-full max-w-xs gap-3">
                <button
                    onClick={onRetry}
                    className="w-full inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md active:scale-95 transition-all"
                >
                    Try Again
                </button>
                <button
                    onClick={onBackToLogin}
                    className="w-full inline-flex items-center justify-center px-6 py-3 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg active:scale-95 transition-all"
                >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Login
                </button>
            </div>
        </div>
    );
};
