/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface LivenessCheckProps {
    onComplete?: (success: boolean) => void;
    onError?: (error: Error) => void;
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

export function LivenessCheck({ onComplete, onError }: LivenessCheckProps) {
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
    // Yaw Ratio: < 0.6 means LEFT, > 1.5 means RIGHT
    // Pitch Ratio: < 0.6 means UP, > 1.5 means DOWN
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

    useEffect(() => {
        console.log('Using Ratio-Based Detection Logic');
        initializeFaceDetection();
        return () => cleanup();
    }, []);

    const initializeFaceDetection = async () => {
        try {
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
            if (onError) onError(error as Error);
        }
    };

    const onResults = (results: any) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            // Only update message if we're not waiting for a transition
            if (!isProcessingRef.current) {
                setMessage('No face detected. Please position your face in the frame.');
            }
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        const ratios = calculateFaceRatios(landmarks);

        drawCanvas(results);
        checkCurrentStep(ratios);
    };

    const calculateFaceRatios = (landmarks: any[]): FaceRatios => {
        const nose = landmarks[1];
        const leftEye = landmarks[33];   // Outer corner left eye
        const rightEye = landmarks[263]; // Outer corner right eye
        const mouthLeft = landmarks[61];
        const mouthRight = landmarks[291];

        // 1. Calculate Distances for Yaw (Horizontal)
        // We use simple 2D euclidean distance
        const dNoseLeftEye = Math.hypot(nose.x - leftEye.x, nose.y - leftEye.y);
        const dNoseRightEye = Math.hypot(nose.x - rightEye.x, nose.y - rightEye.y);

        // Ratio > 1 implies nose is closer to left eye (Wait. If nose is close to left eye, distance is SMALL. So Ratio < 1)
        // We want ratio = LeftDist / RightDist
        // If Look Left -> Nose moves to Left Eye -> LeftDist decreases -> Ratio < 1.
        // If Look Right -> Nose moves to Right Eye -> RightDist decreases -> Ratio > 1.
        const yawRatio = dNoseLeftEye / dNoseRightEye;

        // 2. Calculate Distances for Pitch (Vertical)
        const eyesMidY = (leftEye.y + rightEye.y) / 2;
        const mouthsMidY = (mouthLeft.y + mouthRight.y) / 2;

        // Vertical distance from nose Y to eye line Y
        const dNoseEyes = Math.abs(nose.y - eyesMidY);
        // Vertical distance from nose Y to mouth line Y
        const dNoseMouth = Math.abs(nose.y - mouthsMidY);

        // If Look Up -> Nose moves Up (towards eyes) -> dNoseEyes decreases -> Ratio < 1.
        // If Look Down -> Nose moves Down (towards mouth) -> dNoseEyes increases (or dNoseMouth decreases) -> Ratio > 1.
        const pitchRatio = dNoseEyes / dNoseMouth;

        return { yawRatio, pitchRatio };
    };

    const checkCurrentStep = (ratios: FaceRatios) => {
        // Use Refs to get fresh state inside callback
        const currentStep = currentStepRef.current;
        const isProcessing = isProcessingRef.current;

        if (isProcessing || currentStep >= steps.length) return;

        const step = steps[currentStep];

        // Debug Log
        console.log(`Step ${currentStep} (${step.direction}) | YawR: ${ratios.yawRatio.toFixed(2)} | PitchR: ${ratios.pitchRatio.toFixed(2)}`);

        const isCorrect = step.check(ratios);

        if (isCorrect) {
            // Block immediately using ref
            isProcessingRef.current = true;
            setIsProcessing(true);

            setMessage(`✓ ${step.instruction} - Verified!`);
            console.log(`✅ Verified step ${currentStep}`);

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
        } else {
            // Only update message if not processing
            if (!isProcessing) {
                // Determine feedback based on direction
                let feedback = step.instruction;
                // Optional: Dynamic feedback could be added here
                setMessage(feedback);
            }
        }
    };

    const drawCanvas = (results: any) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (results.multiFaceLandmarks) {
            for (const landmarks of results.multiFaceLandmarks) {
                drawFaceMesh(ctx, landmarks, canvas.width, canvas.height);
            }
        }
        ctx.restore();
    };

    const drawFaceMesh = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
        ctx.fillStyle = '#00FF00';
        for (const index of [1, 33, 263, 61, 291, 152]) {
            const point = landmarks[index];
            ctx.beginPath();
            ctx.arc(point.x * width, point.y * height, 3, 0, 2 * Math.PI);
            ctx.fill();
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
        // Reset refs
        cleanup();

        setCurrentStep(0);
        setIsProcessing(false);
        setMessage(steps[0].instruction);

        // Re-init (setTimeout to allow cleanup to finish effectively if needed, though sync is fine here)
        setTimeout(() => initializeFaceDetection(), 100);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full p-2 overflow-hidden">
            {/* Video Container - Grows/Shrinks to fit */}
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
