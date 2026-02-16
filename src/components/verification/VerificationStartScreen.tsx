import { Shield } from 'lucide-react';

interface VerificationStartScreenProps {
    employeeData: any;
    onStart: () => void;
}

export const VerificationStartScreen = ({ employeeData, onStart }: VerificationStartScreenProps) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
                <Shield className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Verify?</h2>
            {employeeData && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 max-w-sm w-full mx-auto">
                    <p className="text-sm text-gray-500 mb-1">Verifying for:</p>
                    <p className="font-bold text-gray-900 text-lg">
                        {[employeeData.surname, employeeData.first_name].filter(Boolean).join(' ')}
                    </p>
                    <p className="text-sm text-gray-600">{employeeData.employee_no || employeeData.employment_number}</p>
                </div>
            )}
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                We need to verify your identity. Perform a few simple head movements.
                <br />
                Please ensure you are in a well-lit area.
            </p>
            <button
                onClick={onStart}
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
            >
                Start Verification
            </button>
        </div>
    );
};
