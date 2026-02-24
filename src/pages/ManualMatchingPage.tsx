import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import * as faceapi from '@vladmandic/face-api';
import {
    ArrowLeft,
    Upload,
    CheckCircle,
    XCircle,
    ShieldCheck,
    Loader2,
    RefreshCw,
    User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Capture {
    _id: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
    imagePath: string;
    serviceId: string;
    empInfoId: string;
    bvn: string;
}

export function ManualMatchingPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [capture, setCapture] = useState<Capture | null>(location.state?.capture || null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [matchResult, setMatchResult] = useState<{ result: 'match' | 'no-match', score: number } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadModels();
        if (!capture && id) {
            fetchCapture();
        }
    }, [id]);

    const loadModels = async () => {
        try {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            setIsModelsLoaded(true);
        } catch (err) {
            console.error('Failed to load FaceAPI models', err);
            toast.error('Failed to load facial recognition models');
        }
    };

    const fetchCapture = async () => {
        try {
            const baseUrl = import.meta.env.VITE_VERIFICATION_API_BASE_URL || 'https://smart-verify-server.onrender.com';
            const response = await axios.get(`${baseUrl.replace(/\/$/, '')}/i-am-alive/captures`, {
                params: { _id: id },
                headers: token ? { Authorization: `Bearer ${token}` } : undefined
            });
            if (response.data.success && response.data.data.length > 0) {
                setCapture(response.data.data[0]);
            } else {
                toast.error('Capture not found');
            }
        } catch (error) {
            console.error('Error fetching capture:', error);
            toast.error('Failed to load capture details');
        }
    };

    const getProxiedImageUrl = (path: string) => {
        if (!path) return '';
        const baseUrl = (import.meta.env.VITE_VERIFICATION_API_BASE_URL || 'https://smart-verify-server.onrender.com').replace(/\/$/, '');

        if (path.startsWith('http')) {
            // If it's an external URL (not containing our backend base URL), proxy it
            if (!path.includes(baseUrl.replace('https://', '').replace('http://', ''))) {
                return `${baseUrl}/i-am-alive/proxy-image?url=${encodeURIComponent(path)}`;
            }
            return path;
        }

        return `${baseUrl}/${path.startsWith('/') ? path.substring(1) : path}`;
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setMatchResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const performMatch = async () => {
        if (!capture || !uploadedImage || !isModelsLoaded) return;

        setIsProcessing(true);
        const toastId = toast.loading('Comparing faces...');

        try {
            // 1. Process Live Capture
            const captureImageUrl = getProxiedImageUrl(capture.imagePath);

            const liveImg = await faceapi.fetchImage(captureImageUrl);
            const liveDetection = await faceapi.detectSingleFace(liveImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!liveDetection) {
                throw new Error('Could not detect face in the original capture.');
            }

            // 2. Process Uploaded Image
            const uploadImg = await faceapi.fetchImage(uploadedImage);
            const uploadDetection = await faceapi.detectSingleFace(uploadImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!uploadDetection) {
                throw new Error('Could not detect face in the uploaded image. Please try another photo.');
            }

            // 3. Compare
            const distance = faceapi.euclideanDistance(liveDetection.descriptor, uploadDetection.descriptor);
            const threshold = 0.50;
            const isMatch = distance < threshold;
            const score = (Math.exp(-distance * 5) * 100);

            setMatchResult({
                result: isMatch ? 'match' : 'no-match',
                score: parseFloat(score.toFixed(2))
            });

            if (isMatch) {
                toast.success('Faces match successfully!', { id: toastId });
            } else {
                toast.error('Faces do not match.', { id: toastId });
            }

        } catch (error: any) {
            console.error('Matching error:', error);
            toast.error(error.message || 'Error comparing images', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmMatch = async () => {
        if (!capture || !matchResult) return;

        setIsUpdating(true);
        const toastId = toast.loading('Updating record...');

        try {
            const baseUrl = import.meta.env.VITE_VERIFICATION_API_BASE_URL || 'https://smart-verify-server.onrender.com';

            // Assuming the endpoint for updating capture is /i-am-alive/capture/:id
            // If the endpoint is different, this might need adjustment.
            const response = await axios.post(`${baseUrl}/i-am-alive/capture/update-match`, {
                id: capture._id,
                imageMatch: matchResult.result === 'match',
                confidenceLevel: `${matchResult.score}%`,
                manualOverride: true,
                updatedBy: 'admin' // In a real app, get user info
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined
            });

            if (response.data.success) {
                toast.success('Record updated successfully!', { id: toastId });
                navigate('/liveness-report');
            } else {
                throw new Error(response.data.message || 'Failed to update record');
            }
        } catch (error: any) {
            console.error('Update error:', error);
            toast.error(error.message || 'Failed to update record. Manual update might not be supported by backend yet.', { id: toastId });
        } finally {
            setIsUpdating(false);
        }
    };

    if (!capture) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8 flex items-center justify-between">
                <button
                    onClick={() => navigate('/liveness-report')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Reports
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Official Image Match</h1>
                <div className="w-24"></div> {/* Spacer */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Original Capture */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        Original Liveness Capture
                    </h3>
                    <div className="aspect-square bg-gray-900 rounded-xl overflow-hidden relative group">
                        <img
                            src={getProxiedImageUrl(capture.imagePath)}
                            alt="Capture"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <p className="text-white font-medium">{capture.firstName} {capture.lastName}</p>
                            <p className="text-gray-300 text-xs">{capture.employeeNo}</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Manual Match Area */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Official Pensioner Image
                    </h3>

                    <div className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                        {uploadedImage ? (
                            <>
                                <img
                                    src={uploadedImage}
                                    className="w-full h-full object-cover"
                                    alt="Uploaded"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Replace Image
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-8">
                                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                    <Upload className="h-8 w-8 text-blue-500" />
                                </div>
                                <p className="text-sm font-medium text-gray-900">Upload Pensioner Photo</p>
                                <p className="text-xs text-gray-500 mt-1">Select the official image to compare</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                                >
                                    Choose File
                                </button>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    </div>

                    <div className="mt-6 space-y-4">
                        {!matchResult ? (
                            <button
                                onClick={performMatch}
                                disabled={!uploadedImage || isProcessing || !isModelsLoaded}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                            >
                                {isProcessing ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <ShieldCheck className="h-5 w-5" />
                                )}
                                {isProcessing ? 'Comparing...' : 'Run Face Comparison'}
                            </button>
                        ) : (
                            <div className={`${matchResult.result === 'match' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border p-4 rounded-xl`}>
                                <div className="flex items-center gap-3">
                                    {matchResult.result === 'match' ? (
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <XCircle className="h-6 w-6 text-red-600" />
                                    )}
                                    <div>
                                        <p className={`text-sm font-bold ${matchResult.result === 'match' ? 'text-green-800' : 'text-red-800'}`}>
                                            {matchResult.result === 'match' ? 'VERIFIED MATCH' : 'MISMATCH DETECTED'}
                                        </p>
                                        <p className={`text-xs ${matchResult.result === 'match' ? 'text-green-600' : 'text-red-600'}`}>
                                            Confidence Score: {matchResult.score}%
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => setMatchResult(null)}
                                        className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={handleConfirmMatch}
                                        disabled={isUpdating}
                                        className={`flex-1 px-4 py-2 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 ${matchResult.result === 'match' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                                    >
                                        {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {matchResult.result === 'match' ? 'Confirm & Update' : 'Force Match anyway'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Info Sidebar/Header */}
            <div className="mt-8 bg-blue-50 p-6 rounded-2xl border border-blue-100 flex flex-wrap gap-8 items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <User className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Pensioner Details</p>
                        <p className="text-lg font-bold text-gray-900">{capture.firstName} {capture.lastName}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-2">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Employee No</p>
                        <p className="text-sm font-mono font-bold text-gray-800">{capture.employeeNo}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Service ID</p>
                        <p className="text-sm font-mono font-bold text-gray-800">{capture.serviceId || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">BVN</p>
                        <p className="text-sm font-mono font-bold text-gray-800">{capture.bvn || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
