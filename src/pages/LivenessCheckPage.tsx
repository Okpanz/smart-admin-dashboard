/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LivenessCheck } from '../components/LivenessCheck';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import toast from 'react-hot-toast';
import { VerificationHeader, VerificationFooter } from '../components/verification/VerificationLayout';
import { VerificationStartScreen } from '../components/verification/VerificationStartScreen';
import { VerificationErrorScreen } from '../components/verification/VerificationErrorScreen';

export function LivenessCheckPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isVerified, setIsVerified] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isMatching, setIsMatching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [matchResult, setMatchResult] = useState<'match' | 'no-match' | null>(null);
    const [matchScore, setMatchScore] = useState<number | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // Retrieve employee data passed from VerificationPage
    const employeeData = location.state?.employeeData;

    useEffect(() => {
        if (!employeeData) {
            console.log('No employee data found, redirecting to verification');
            // navigate('/verification');
        }
        loadModels();
    }, [employeeData, navigate]);

    const loadModels = async () => {
        try {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            console.log('FaceAPI models loaded');
            setModelsLoaded(true);
        } catch (err) {
            console.error('Failed to load FaceAPI models', err);
            setError('Failed to load facial recognition models. Please refresh.');
        }
    };

    useEffect(() => {
        if (isVerified && modelsLoaded && !isSubmitting && !matchResult && !isSubmissionComplete) {
            handleProcessAndSubmit();
        }
    }, [isVerified, modelsLoaded]);

    const handleComplete = (success: boolean) => {
        if (success) {
            setIsVerified(true);
            console.log('User verified as live! Waiting for models/resources to process...');
        }
    };

    const handleError = (error: Error) => {
        console.error('Liveness check error:', error);
        setError(error.message || 'Unable to complete liveness check. Please check your camera permissions.');
    };

    const handleCapture = (imageSrc: string) => {
        setCapturedImage(imageSrc);
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    const handleStartOver = () => {
        setIsVerified(false);
        setError(null);
        setCapturedImage(null);
        setMatchResult(null);
        setIsMatching(false);
        setMatchScore(null);
        setIsSubmitting(false);
    };

    const handleSubmit = async (
        overrideMatchResult?: 'match' | 'no-match' | null,
        overrideMatchScore?: number | null
    ) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const toastId = toast.loading('Submitting verification...');

        const finalMatchResult = overrideMatchResult ?? matchResult;
        const finalMatchScore = overrideMatchScore ?? matchScore;

        // Calculate confidence level
        const confidence = finalMatchScore !== null
            ? (Math.exp(-finalMatchScore * 5) * 100).toFixed(2)
            : '0.00';

        const submissionData = {
            employee_no: employeeData.employee_no || employeeData.employment_number,
            first_name: employeeData.first_name,
            last_name: employeeData.surname, // Using surname as last_name
            middle_name: employeeData.middle_name || '',
            date_of_birth: employeeData.date_of_birth || 'N/A',
            emp_info_id: employeeData.idemp_info || employeeData.id || employeeData.emp_info_id,
            service_id: employeeData.service_id || 'N/A',
            capturedImage,
            bvn: employeeData.bvn || 'N/A',
            account_number: employeeData.account_number || 'N/A',
            phone_number: employeeData.phone || 'N/A',
            email: employeeData.email || 'N/A',
            confidence_level: `${confidence}%`,
            match_score: parseFloat(confidence), // Using the confidence percentage as the match_score
            image_match: finalMatchResult === 'match',
            timestamp: new Date().toISOString(),
        };

        console.group('Verification Submission Data');
        console.log('Submission Payload:', submissionData);
        console.groupEnd();

        try {
            const employeeNo = employeeData.employee_no || employeeData.employment_number;
            const baseUrl = import.meta.env.VITE_VERIFICATION_API_BASE_URL || 'https://i-am-alive-server.onrender.com';

            // In dev, use relative URLs so Vite's proxy handles the request (avoids CORS).
            // In production, use the full base URL.
            const apiPrefix = import.meta.env.DEV ? '' : baseUrl.replace(/\/$/, '');

            const verifyUrl = `${apiPrefix}/pensionaire/verify?employee_no=${encodeURIComponent(employeeNo)}`;
            console.log('Verification API URL:', verifyUrl);

            const verifyResponse = await axios.get(verifyUrl);
            console.log('Verification API Response:', verifyResponse.data);

            if (typeof verifyResponse.data === 'string' && verifyResponse.data.toLowerCase().includes('<!doctype html')) {
                throw new Error('Verification endpoint returned HTML instead of JSON. Check deployment URL configuration.');
            }

            const captureUrl = `${apiPrefix}/i-am-alive/capture`;
            console.log('Capture API URL:', captureUrl);

            const capturePayload = {
                ...submissionData,
                clientType: 'web',
            };

            const captureResponse = await axios.post(captureUrl, capturePayload);
            console.log('Capture API Response:', captureResponse.data);

            if (captureResponse.data && captureResponse.data.success) {
                toast.success(`Verification Submitted!`, { id: toastId });
                // Only show success screen if the API explicitly returns success
                setIsSubmissionComplete(true);
            } else {
                const errorMsg = captureResponse.data?.message || 'Backend failed to process capture.';
                toast.error(`Submission Failed: ${errorMsg}`, { id: toastId });
                setError(errorMsg);
                setIsSubmitting(false); // Enable retry button by turning off submitting state
            }
        } catch (err) {
            console.error('Submission error:', err);
            let errorMessage = 'An unexpected error occurred during submission.';

            if (axios.isAxiosError(err) && err.response) {
                // Professional error extraction from backend response
                errorMessage = err.response.data?.message || err.response.data?.error || `Server returned ${err.response.status}`;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            toast.error(`Submission Failed: ${errorMessage}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    // New state for showing the final Success Card
    const [isSubmissionComplete, setIsSubmissionComplete] = useState(false);

    // const [officialMatchScore] = useState<number | null>(null);
    // const [bvnMatchScore] = useState<number | null>(null);

    const performMatch = async (): Promise<{ result: 'match' | 'no-match', score: number } | null> => {
        if (!capturedImage || !employeeData || !modelsLoaded) {
            console.error("performMatch missing dependencies:", { capturedImage: !!capturedImage, employeeData: !!employeeData, modelsLoaded });
            return null;
        }

        // Note: We do NOT set isMatching state here to avoid UI flickering if we are submittting immediately.
        // The calling function should handle loading states.

        try {
            // 1. Process Captured Image
            console.log('Detecting face in live capture...');
            let capturedDetection;
            try {
                const capturedImg = await faceapi.fetchImage(capturedImage);
                // Lowered minConfidence from 0.5 to 0.4 for robustness in dark environments
                capturedDetection = await faceapi.detectSingleFace(capturedImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!capturedDetection) {
                    console.log('SSD detector failed, trying TinyFaceDetector...');
                    // Lowered scoreThreshold from 0.5 to 0.35
                    capturedDetection = await faceapi.detectSingleFace(capturedImg, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.35 }))
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                }
            } catch (err) {
                console.error('Capture processing error:', err);
                throw new Error('Could not process captured image. Please retake.');
            }

            if (!capturedDetection) {
                console.error('Face detection failed even with secondary detector.');
                throw new Error('Could not detect a face in the captured live image. Try moving to a brighter place and ensuring your face is clearly visible.');
            }
            console.log('Face detected in live capture successfully.');

            // 2. Process Official Photo
            let officialScore = null;
            try {
                const officialPhotoUrl = `/images/${employeeData.employee_no || employeeData.employment_number}.png`;
                const officialImg = await faceapi.fetchImage(officialPhotoUrl);
                let officialDetection = await faceapi.detectSingleFace(officialImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!officialDetection) {
                    officialDetection = await faceapi.detectSingleFace(officialImg, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 }))
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                }

                if (officialDetection) {
                    officialScore = faceapi.euclideanDistance(capturedDetection.descriptor, officialDetection.descriptor);
                }
            } catch (err) {
                console.warn('Official photo detection failed:', err);
            }

            // 3. Process BVN Photo
            let bvnScore = null;
            try {
                const bvnEmployeeNo = employeeData.employee_no || employeeData.employment_number;
                const apiBase =
                    import.meta.env.VITE_VERIFICATION_API_BASE_URL || 'https://i-am-alive-server.onrender.com';

                const bvnPhotoUrl = import.meta.env.DEV
                    ? `/bvn-images/bvn-image-${bvnEmployeeNo}.jpg`
                    : `${apiBase.replace(/\/$/, '')}/pensionaire/photo?employee_no=${encodeURIComponent(bvnEmployeeNo)}&type=bvn`;

                const bvnImg = await faceapi.fetchImage(bvnPhotoUrl);
                let bvnDetection = await faceapi.detectSingleFace(bvnImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!bvnDetection) {
                    bvnDetection = await faceapi.detectSingleFace(bvnImg, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 }))
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                }

                if (bvnDetection) {
                    bvnScore = faceapi.euclideanDistance(capturedDetection.descriptor, bvnDetection.descriptor);
                }
            } catch (err) {
                console.warn('BVN photo detection failed:', err);
            }

            const threshold = 0.50;
            const isOfficialMatch = officialScore !== null && officialScore < threshold;
            const isBvnMatch = bvnScore !== null && bvnScore < threshold;

            // Note: We don't throw if records are missing, we just submit 'no-match'
            const isMatch = isOfficialMatch || isBvnMatch;
            const result: 'match' | 'no-match' = isMatch ? 'match' : 'no-match';
            const bestScore = Math.min(officialScore ?? 1, bvnScore ?? 1);

            return { result, score: bestScore };

        } catch (err) {
            const error = err as Error;
            // Only throw if it's a critical capture error (e.g. no face detected)
            if (error.message.includes('captured live image')) {
                throw error;
            }
            // For other errors (matching errors), we return 'no-match'
            console.error('Face matching error (non-critical):', error);
            return { result: 'no-match', score: 1 };
        }
    };

    const handleProcessAndSubmit = async () => {
        if (isMatching || isSubmitting) return;

        // Show submitting state immediately to avoid any "Failed" UI flash
        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Run Match Logic (Pure calculation, no side effects on success/fail UI)
            const matchData = await performMatch();

            // 2. If Match Success, Submit
            if (matchData) {
                // Set state for UI display
                setMatchResult(matchData.result);
                setMatchScore(matchData.score);
                // Submit the data
                await handleSubmit(matchData.result, matchData.score);
            } else {
                // Should not happen if performMatch handles its errors, but just in case
                throw new Error('Verification processing failed.');
            }
        } catch (err) {
            console.error("Process error:", err);
            const error = err as Error;
            setError(error.message);
            setIsSubmitting(false); // Only turn off if we actually error out and stop
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
            <VerificationHeader />

            <div className="flex-1 flex items-stretch justify-center px-3 py-4 sm:p-4 min-h-0">
                <div className="w-full max-w-3xl bg-white rounded-none sm:rounded-2xl shadow-none sm:shadow-xl overflow-hidden flex flex-col max-h-full sm:max-h-[90vh]">
                    {!isStarted ? (
                        <VerificationStartScreen
                            employeeData={employeeData}
                            onStart={() => setIsStarted(true)}
                        />
                    ) : error ? (
                        <VerificationErrorScreen
                            error={error}
                            onRetry={handleStartOver}
                            onBackToLogin={handleBackToLogin}
                        />
                    ) : !isVerified ? (
                        <div className="flex-1 overflow-y-auto w-full">
                            <LivenessCheck
                                onComplete={handleComplete}
                                onError={handleError}
                                onCapture={handleCapture}
                            />
                        </div>
                    ) : isSubmissionComplete ? (
                        <div className="flex flex-col items-center justify-center h-full px-4 py-6 sm:p-8 text-center space-y-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>

                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Verification Failed</h2>

                            <p className="text-gray-600 max-w-md text-sm sm:text-base">
                                Please proceed to the <span className="font-semibold text-gray-800">Rivers State Pension Board</span> for further review. Thank you.
                            </p>

                            {/* Image-match notice — only shown when face couldn't be matched */}
                            {matchResult === 'no-match' && (
                                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 max-w-sm w-full flex items-start gap-3 text-left">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">Image match could not be confirmed</p>
                                        <p className="text-xs text-amber-700 mt-0.5">
                                            Your submission was recorded, but the captured photo did not match the reference image on file. A reviewer will assess your submission manually.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => navigate('/')}
                                className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-md text-sm font-medium"
                            >
                                Return Home
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full px-4 py-6 sm:p-8 text-center space-y-6">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>

                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Verifying Identity...</h2>

                            <p className="text-gray-500 text-sm sm:text-base">
                                Please wait while we verify your captured data against official records.
                                <br />
                                This may take a few moments.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <VerificationFooter />
        </div >
    );
}
