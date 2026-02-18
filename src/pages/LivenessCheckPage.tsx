import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LivenessCheck } from '../components/LivenessCheck';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import toast from 'react-hot-toast';
import { VerificationHeader, VerificationFooter } from '../components/verification/VerificationLayout';
import { VerificationStartScreen } from '../components/verification/VerificationStartScreen';
import { VerificationErrorScreen } from '../components/verification/VerificationErrorScreen';
import { VerificationSuccessScreen } from '../components/verification/VerificationSuccessScreen';

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

    const handleComplete = (success: boolean) => {
        if (success) {
            setIsVerified(true);
            console.log('User verified as live!');
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
            bvn: employeeData.bvn || 'N/A',
            account_number: employeeData.account_number || 'N/A',
            image_match: finalMatchResult === 'match',
            firstName: employeeData.first_name,
            lastName: employeeData.surname,
            middleName: employeeData.middle_name || '',
            date_of_birth: employeeData.date_of_birth || 'N/A',
            // MAPPING FIX: The API returns `idemp_info`, so we use that. Fallback to `id`.
            emp_info_id: employeeData.idemp_info || employeeData.id || employeeData.emp_info_id,
            service_id: employeeData.service_id || 'N/A',
            phone: employeeData.phone || 'N/A',
            phone_number: employeeData.phone || 'N/A',
            email: employeeData.email || 'N/A',
            confidence_level: `${confidence}%`,
            capturedImage,
            matchResult: finalMatchResult,
            matchScore: finalMatchScore,
            timestamp: new Date().toISOString(),
        };

        console.group('Verification Submission Data');
        console.log('Submission Payload:', submissionData);
        console.groupEnd();

        try {
            const employeeNo = employeeData.employee_no || employeeData.employment_number;
            const baseUrl = import.meta.env.DEV
                ? '/api/v1/get-pensionaire-verification-info'
                : 'https://rivers.thesmartapps.org/api/v1/get-pensionaire-verification-info';
            const url = `${baseUrl}?employee_no=${encodeURIComponent(employeeNo)}`;
            console.log('Verification API URL:', url);
            const response = await axios.get(url);
            console.log('Verification API Response:', response.data);
            if (typeof response.data === 'string' && response.data.toLowerCase().includes('<!doctype html')) {
                throw new Error('Verification endpoint returned HTML instead of JSON. Check deployment URL configuration.');
            }
            toast.success(`Verification Submitted!`, { id: toastId });
            navigate('/');
        } catch (err) {
            const error = err as Error;
            console.error('Submission error:', error);
            alert(`Submission Failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const [officialMatchScore] = useState<number | null>(null);
    const [bvnMatchScore] = useState<number | null>(null);

    const performMatch = async (): Promise<{ result: 'match' | 'no-match', score: number } | null> => {
        if (!capturedImage || !employeeData || !modelsLoaded) return null;

        // Note: We do NOT set isMatching state here to avoid UI flickering if we are submittting immediately.
        // The calling function should handle loading states.

        try {
            // 1. Process Captured Image
            let capturedDetection;
            try {
                const capturedImg = await faceapi.fetchImage(capturedImage);
                capturedDetection = await faceapi.detectSingleFace(capturedImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!capturedDetection) {
                    capturedDetection = await faceapi.detectSingleFace(capturedImg, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 }))
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                }
            } catch (err) {
                console.error('Capture processing error:', err);
                throw new Error('Could not process captured image. Please retake.');
            }

            if (!capturedDetection) {
                throw new Error('Could not detect a face in the captured live image. Try moving closer to the camera or ensuring better lighting.');
            }

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
                    (import.meta as { env: { [key: string]: string } }).env
                        .VITE_VERIFICATION_API_BASE_URL || 'https://i-am-alive-server.onrender.com';

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
        <div className="h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
            <VerificationHeader />

            {/* Main Content - Grows */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-full">
                    {!isStarted ? (
                        <VerificationStartScreen
                            employeeData={employeeData}
                            onStart={() => setIsStarted(true)}
                        />
                    ) : !isVerified && !error ? (
                        <div className="flex-1 overflow-y-auto w-full">
                            <LivenessCheck
                                onComplete={handleComplete}
                                onError={handleError}
                                onCapture={handleCapture}
                            />
                        </div>
                    ) : isVerified ? (
                        <VerificationSuccessScreen
                            matchResult={matchResult}
                            matchScore={matchScore}
                            officialMatchScore={officialMatchScore}
                            bvnMatchScore={bvnMatchScore}
                            capturedImage={capturedImage}
                            employeeData={employeeData}
                            error={error}
                            isMatching={isMatching}
                            isSubmitting={isSubmitting}
                            modelsLoaded={modelsLoaded}
                            onMatch={handleProcessAndSubmit}
                            onSubmit={handleSubmit}
                            onRestart={handleStartOver}
                        />
                    ) : (
                        <VerificationErrorScreen
                            error={error}
                            onRetry={handleStartOver}
                            onBackToLogin={handleBackToLogin}
                        />
                    )}
                </div>
            </div>

            <VerificationFooter />
        </div>
    );
}
