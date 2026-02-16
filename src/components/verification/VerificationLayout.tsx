import { Shield } from 'lucide-react';

export const VerificationHeader = () => (
    <div className="flex-none pt-2 pb-1 px-4 text-center z-10">
        <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-primary-50 mb-1">
            <Shield className="h-5 w-5 text-primary-600" />
        </div>
        <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
            Face Liveness Verification
        </h1>
        <p className="text-[10px] md:text-xs text-gray-600 mt-0.5">
            Follow instructions to verify identity
        </p>
    </div>
);

export const VerificationFooter = () => (
    <div className="flex-none p-4 text-center text-xs text-gray-400 z-10">
        <p>Protected by Smart Liveness Verification</p>
    </div>
);
