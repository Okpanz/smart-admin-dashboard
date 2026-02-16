/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface LivenessCheckProps {
    onComplete?: (success: boolean) => void;
    onError?: (error: Error) => void;
    onCapture?: (imageSrc: string) => void;
}

interface Step {
    direction: 'center' | 'left' | 'right' | 'up' | 'down';
    instruction: string;
    // We now use specific check functions or ranges rather than a single threshold
    check: (ratios: FaceRatios) => boolean;
}

interface FaceRatios {
    yawRatio: number;   // nose-left / nose-right
    pitchRatio: number; // nose-eyes / nose-mouth
}

export function LivenessCheck({ onComplete, onError, onCapture }: LivenessCheckProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('Position your face in the frame');
    const faceMeshRef = useRef<FaceMesh | null>(null);
    const cameraRef = useRef<Camera | null>(null);

    // Refs for state accessible inside MediaPipe callbacks
    const currentStepRef = useRef(0);
    const isProcessingRef = useRef(false);

    useEffect(() => {
        currentStepRef.current = currentStep;
    }, [currentStep]);

    useEffect(() => {
        isProcessingRef.current = isProcessing;
    }, [isProcessing]);

    // Define the sequence of checks with Ratio-based logic
    const steps: Step[] = [
        {
            direction: 'center',
            instruction: 'Look straight at the camera',
            check: (r) => r.yawRatio > 0.7 && r.yawRatio < 1.4 && r.pitchRatio > 0.7 && r.pitchRatio < 1.4
        },
        {
            direction: 'left',
            instruction: 'Turn your head LEFT',
            check: (r) => r.yawRatio < 0.6 // Nose closer to left eye
        },
        {
            direction: 'right',
            instruction: 'Turn your head RIGHT',
            check: (r) => r.yawRatio > 1.6 // Nose closer to right eye
        },
        {
            direction: 'up',
            instruction: 'Look UP',
            check: (r) => r.pitchRatio < 0.6 // Nose closer to eyes
        },
        {
            direction: 'down',
            instruction: 'Look DOWN',
            check: (r) => r.pitchRatio > 1.4 // Nose closer to mouth
        }
    ];

    const initializeFaceDetection = async () => {
        try {
            // Explicitly request camera permission first to handle errors better
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to load metadata to ensure dimensions are ready
                await new Promise((resolve) => {
                    if (videoRef.current) {
                        videoRef.current.onloadedmetadata = resolve;
                    } else {
                        resolve(null);
                    }
                });
                videoRef.current.play();
            }

            const faceMesh = new FaceMesh({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            faceMesh.onResults(onResults);
            faceMeshRef.current = faceMesh;

            if (videoRef.current) {
                // Use Camera utility from MediaPipe to manage sending frames
                const camera = new Camera(videoRef.current, {
                    onFrame: async () => {
                        if (faceMeshRef.current && videoRef.current) {
                            await faceMeshRef.current.send({ image: videoRef.current });
                        }
                    },
                    width: 640,
                    height: 480
                });

                await camera.start();
                cameraRef.current = camera;
            }
        } catch (error) {
            console.error('Initialization error:', error);
            setMessage('Camera Error: Permisson denied or device unavailable.');
            if (onError) onError(error as Error);
        }
    };

    const onResults = (results: any) => {
        // Always draw the video first (CLEAN STATE)
        drawSyncedVideo();

        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            if (!isProcessingRef.current) {
                setMessage('No face detected. Please position your face in the frame.');
            }
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        const ratios = calculateFaceRatios(landmarks);

        // Check logic - if this passes, it might trigger a capture
        // Since we just drew the clean video, capturing now is safe (no landmarks yet)
        checkCurrentStep(ratios);

        // Draw landmarks ON TOP of the video (and potentially captured frame)
        drawLandmarksOverlay(landmarks);
    };

    const drawSyncedVideo = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Match dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ZOOM_FACTOR = 1.8;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Digital Zoom Math
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const cropW = vw / ZOOM_FACTOR;
        const cropH = vh / ZOOM_FACTOR;
        const cropX = (vw - cropW) / 2;
        const cropY = (vh - cropH) / 2;

        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    };

    const drawLandmarksOverlay = (landmarks: any[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const ZOOM_FACTOR = 1.8;

        ctx.save();
        drawFaceMesh(ctx, landmarks, canvas.width, canvas.height, ZOOM_FACTOR);
        ctx.restore();
    };

    const drawFaceMesh = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number, zoom: number) => {
        ctx.fillStyle = '#00FF00';
        for (const index of [1, 33, 263, 61, 291, 152]) {
            const point = landmarks[index];

            const cropSize = 1 / zoom;
            const startOffset = (1 - cropSize) / 2;

            const x = (point.x - startOffset) / cropSize;
            const y = (point.y - startOffset) / cropSize;

            if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
                ctx.beginPath();
                ctx.arc(x * width, y * height, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    };

    const calculateFaceRatios = (landmarks: any[]): FaceRatios => {
        const nose = landmarks[1];
        const leftEye = landmarks[33];   // Outer corner left eye
        const rightEye = landmarks[263]; // Outer corner right eye
        const mouthLeft = landmarks[61];
        const mouthRight = landmarks[291];

        // 1. Calculate Distances for Yaw (Horizontal)
        const dNoseLeftEye = Math.hypot(nose.x - leftEye.x, nose.y - leftEye.y);
        const dNoseRightEye = Math.hypot(nose.x - rightEye.x, nose.y - rightEye.y);

        const yawRatio = dNoseLeftEye / dNoseRightEye;

        // 2. Calculate Distances for Pitch (Vertical)
        const eyesMidY = (leftEye.y + rightEye.y) / 2;
        const mouthsMidY = (mouthLeft.y + mouthRight.y) / 2;

        const dNoseEyes = Math.abs(nose.y - eyesMidY);
        const dNoseMouth = Math.abs(nose.y - mouthsMidY);

        const pitchRatio = dNoseEyes / dNoseMouth;

        return { yawRatio, pitchRatio };
    };

    const checkCurrentStep = (ratios: FaceRatios) => {
        const currentStep = currentStepRef.current;
        const isProcessing = isProcessingRef.current;

        if (isProcessing || currentStep >= steps.length) return;

        const step = steps[currentStep];

        // Debug Log
        // console.log(`Step ${currentStep} (${step.direction}) | YawR: ${ratios.yawRatio.toFixed(2)} | PitchR: ${ratios.pitchRatio.toFixed(2)}`);

        const isCorrect = step.check(ratios);

        if (isCorrect) {
            isProcessingRef.current = true;
            setIsProcessing(true);

            // Special handling for Center Step (Index 0)
            if (currentStep === 0) {
                setMessage('Capturing face...');

                // Capture immediately since we are in a clean state (pre-landmarks)
                if (onCapture) {
                    const canvas = canvasRef.current;
                    if (canvas) {
                        const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
                        onCapture(imageSrc);
                        console.log('📸 Face captured at center position');
                    }
                }

                // Show success message briefly before moving on
                setTimeout(() => {
                    setMessage('✓ Face Captured! Get ready...');
                }, 500);

                setTimeout(() => {
                    const nextStep = currentStep + 1;
                    setCurrentStep(nextStep);
                    setMessage(steps[nextStep].instruction);
                    setIsProcessing(false);
                }, 2000); // 2 second pause for user to realize capture happened

            } else {
                // Normal steps
                setMessage(`✓ ${step.instruction} - Verified!`);

                setTimeout(() => {
                    const nextStep = currentStep + 1;
                    if (nextStep < steps.length) {
                        setCurrentStep(nextStep);
                        setMessage(steps[nextStep].instruction);
                        setIsProcessing(false);
                    } else {
                        setMessage('✓ Liveness check complete!');
                        cleanup();
                        if (onComplete) onComplete(true);
                    }
                }, 1000);
            }
        } else {
            if (!isProcessing) {
                setMessage(step.instruction);
            }
        }
    };

    const cleanup = () => {
        if (cameraRef.current) {
            try {
                cameraRef.current.stop();
            } catch (e) {
                console.warn('Error stopping camera:', e);
            }
            cameraRef.current = null;
        }
        if (faceMeshRef.current) {
            try {
                faceMeshRef.current.close();
            } catch (e) {
                console.warn('Error closing FaceMesh:', e);
            }
            faceMeshRef.current = null;
        }
    };

    const handleRetry = () => {
        cleanup();
        setCurrentStep(0);
        setIsProcessing(false);
        setMessage(steps[0].instruction);
        setTimeout(() => initializeFaceDetection(), 100);
    };

    useEffect(() => {
        console.log('Using Ratio-Based Detection Logic with 1.8x Zoom');
        void initializeFaceDetection();
        return () => cleanup();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full p-2 overflow-hidden">
            <div className="relative w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-xl bg-black shadow-lg">
                <video ref={videoRef} className="hidden" playsInline />
                <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
            </div>

            <div className="mt-4 w-full max-w-xl text-center flex flex-col items-center">
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300 ease-in-out"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                </div>

                <h2 className="text-xl md:text-2xl font-semibold text-gray-800 my-2 min-h-[40px] flex items-center justify-center leading-tight">
                    {message}
                </h2>

                <div className="flex justify-center items-center gap-2 flex-wrap my-2">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all duration-300 ${index < currentStep
                                ? 'bg-green-500 text-white'
                                : index === currentStep
                                    ? 'bg-blue-500 text-white scale-105 shadow-md'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                        >
                            {step.direction}
                        </div>
                    ))}
                </div>

                {currentStep === steps.length && (
                    <button
                        onClick={handleRetry}
                        className="mt-3 px-6 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg"
                    >
                        Start Over
                    </button>
                )}
            </div>
        </div>
    );
}
