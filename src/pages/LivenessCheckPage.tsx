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

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const toastId = toast.loading('Submitting verification...');

        // Calculate confidence level
        const confidence = matchScore !== null
            ? (Math.exp(-matchScore * 5) * 100).toFixed(2)
            : '0.00';

        const submissionData = {
            employee_no: employeeData.employee_no || employeeData.employment_number,
            bvn: employeeData.bvn || 'N/A',
            account_number: employeeData.account_number || 'N/A',
            image_match: matchResult === 'match',
            firstName: employeeData.first_name,
            lastName: employeeData.surname,
            middleName: employeeData.middle_name || '',
            date_of_birth: employeeData.date_of_birth || 'N/A',
            // MAPPING FIX: The API returns `idemp_info`, so we use that. Fallback to `id`.
            emp_info_id: employeeData.idemp_info || employeeData.id || employeeData.emp_info_id,
            service_id: employeeData.service_id || 'N/A',
            confidence_level: `${confidence}%`,
            capturedImage,
            matchResult,
            matchScore,
            timestamp: new Date().toISOString(),
        };

        console.group('Verification Submission Data');
        console.log('Submission Payload:', submissionData);
        console.groupEnd();

        try {
            const baseUrl = (import.meta as { env: { [key: string]: string } }).env.VITE_VERIFICATION_API_BASE_URL || 'https://i-am-alive-sever.onrender.com';
            const url = `${baseUrl.replace(/\/$/, '')}/i-am-alive/capture`;
            console.log('Verification API URL:', url);
            const response = await axios.post(url, submissionData);
            console.log('Verification API Response:', response.data);
            if (typeof response.data === 'string' && response.data.toLowerCase().includes('<!doctype html')) {
                throw new Error('Verification endpoint returned HTML instead of JSON. Check deployment URL configuration.');
            }
            toast.success(`Verification Submitted! Confidence: ${confidence}%`, { id: toastId });
            navigate('/');
        } catch (err) {
            const error = err as Error;
            console.error('Submission error:', error);
            alert(`Submission Failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMatch = async () => {
        if (!capturedImage || !employeeData || !modelsLoaded) return;

        setIsMatching(true);
        setError(null);

        try {
            // 1. Process Captured Image
            // Create an HTMLImageElement from the base64 string
            const capturedImg = await faceapi.fetchImage(capturedImage);
            const capturedDetection = await faceapi.detectSingleFace(capturedImg).withFaceLandmarks().withFaceDescriptor();

            if (!capturedDetection) {
                throw new Error('Could not detect a face in the captured live image. Please retake.');
            }

            // 2. Process Official Photo
            // Use the proxy path /images/... to avoid CORS
            const officialPhotoUrl = `/images/${employeeData.employee_no || employeeData.employment_number}.png`;

            // We need to fetch it as a blob first to handle errors gracefully, or use faceapi.fetchImage
            let officialImg: HTMLImageElement;
            try {
                officialImg = await faceapi.fetchImage(officialPhotoUrl);
            } catch {
                // Fallback or specific error if image 404s
                throw new Error('Official employee photo not found or could not be loaded.');
            }

            const officialDetection = await faceapi.detectSingleFace(officialImg).withFaceLandmarks().withFaceDescriptor();

            if (!officialDetection) {
                throw new Error('Could not detect a face in the official employee photo.');
            }

            // 3. Compare Descriptors
            const distance = faceapi.euclideanDistance(capturedDetection.descriptor, officialDetection.descriptor);
            console.log('Match Distance:', distance);
            setMatchScore(distance);

            // Threshold: 0.45 for stricter matching (default is usually 0.6)
            // Lower distance = better match
            const isMatch = distance < 0.45;

            setMatchResult(isMatch ? 'match' : 'no-match');

        } catch (err) {
            const error = err as Error;
            console.error('Face matching error:', error);
            setError(error.message || 'Failed to verify match.');
            setMatchResult('no-match'); // Or maybe keep as null and show error?
        } finally {
            setIsMatching(false);
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
                            capturedImage={capturedImage}
                            employeeData={employeeData}
                            error={error}
                            isMatching={isMatching}
                            isSubmitting={isSubmitting}
                            modelsLoaded={modelsLoaded}
                            onMatch={handleMatch}
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
