/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera as MPCamera } from '@mediapipe/camera_utils';
import { SwitchCamera } from 'lucide-react';

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
    isPositioned: boolean;
    guidance?: string;
    isTooDark?: boolean;
}

export function LivenessCheck({ onComplete, onError, onCapture }: LivenessCheckProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('Position your face in the frame');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const faceMeshRef = useRef<FaceMesh | null>(null);
    const cameraRef = useRef<MPCamera | null>(null);

    // Refs for state accessible inside MediaPipe callbacks
    const currentStepRef = useRef(0);
    const isProcessingRef = useRef(false);
    const lastGuidanceSpeakRef = useRef<number>(0);
    const lastGuidanceMsgRef = useRef<string>('');

    // --- 2-second countdown before each capture/step-advance ---
    // countdownValueRef drives the canvas drawing AND the UI message.
    // No React state is needed for the number itself — setMessage() handles the text.
    const HOLD_SECONDS = 5;
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownValueRef = useRef<number | null>(null);      // null = not counting

    const clearCountdown = () => {
        if (countdownIntervalRef.current !== null) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        countdownValueRef.current = null;
    };

    // Shared Constant for Zoom
    const ZOOM_FACTOR = 1.3;

    // Voice Command Helper
    const speak = (text: string) => {
        if (!window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
    };

    // Trigger voice on step change
    useEffect(() => {
        if (currentStep < steps.length) {
            const timer = setTimeout(() => {
                const instruction = steps[currentStep].instruction;
                speak(instruction);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            speak("Liveness check complete!");
        }
    }, [currentStep]);

    // Initial greeting
    useEffect(() => {
        const timer = setTimeout(() => {
            speak("Position your face in the frame");
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

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
            check: (r) => r.yawRatio > 1.6
        },
        {
            direction: 'right',
            instruction: 'Turn your head RIGHT',
            check: (r) => r.yawRatio < 0.6
        },
        {
            direction: 'up',
            instruction: 'Look UP',
            check: (r) => r.pitchRatio < 0.6
        },
        {
            direction: 'down',
            instruction: 'Look DOWN',
            check: (r) => r.pitchRatio > 1.4
        }
    ];

    const initializeFaceDetection = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: facingMode }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
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
                const camera = new MPCamera(videoRef.current, {
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
        drawSyncedVideo();

        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            if (!isProcessingRef.current) {
                setMessage('No face detected. Please position your face in the frame.');
            }
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        const brightness = calculateAverageBrightness();
        const ratios = calculateFaceRatios(landmarks, brightness);

        // Draw Guide Frame (pass countdown so the user sees the timer on screen)
        drawGuideFrame(ratios.isPositioned, countdownValueRef.current);

        // Draw Directional Arrow if needed
        const currentStepIndex = currentStepRef.current;
        if (currentStepIndex > 0 && currentStepIndex < steps.length) {
            drawDirectionalArrow(steps[currentStepIndex].direction);
        }

        // Check logic - if this passes, it might trigger a capture
        checkCurrentStep(ratios);
        drawLandmarksOverlay(landmarks);
    };

    const calculateAverageBrightness = (): number => {
        const canvas = canvasRef.current;
        if (!canvas) return 255; // Default to bright if no canvas
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return 255;

        // We only sample a subset of pixels for performance
        // Sample the center area where the face guide is
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.45;
        const width = canvas.width * 0.4;
        const height = canvas.height * 0.6;

        try {
            const imageData = ctx.getImageData(centerX - width / 2, centerY - height / 2, width, height);
            const data = imageData.data;
            let totalBrightness = 0;

            // RGBA format, so step by 4
            for (let i = 0; i < data.length; i += 40) { // Sample every 10th pixel for speed
                // Using relative luminance formula
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
                totalBrightness += brightness;
            }

            return totalBrightness / (data.length / 40);
        } catch (e) {
            console.warn('Brightness check failed:', e);
            return 255;
        }
    };

    const drawGuideFrame = (isPositioned: boolean, countdown: number | null) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.45;
        const radiusX = canvas.width * 0.22;
        const radiusY = canvas.height * 0.35;

        // Dim outside the oval
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.moveTo(centerX + radiusX, centerY);
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.fill('evenodd');
        ctx.restore();

        // Oval border — yellow while counting, green when positioned, white dashed otherwise
        const isCounting = countdown !== null && countdown > 0;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.lineWidth = isCounting ? 6 : 4;
        ctx.strokeStyle = isCounting ? '#FACC15' : (isPositioned ? '#00FF00' : '#FFFFFF');
        if (!isPositioned && !isCounting) ctx.setLineDash([15, 10]);
        ctx.stroke();
        ctx.restore();

        // Countdown digit drawn inside the oval (only on this display canvas, not in captured image)
        if (isCounting) {
            ctx.save();
            const fontSize = Math.round(radiusY * 0.7);
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#FACC15';
            ctx.fillText(String(countdown), centerX, centerY);
            ctx.restore();
        }
    };

    const drawDirectionalArrow = (direction: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.45;
        const radiusX = canvas.width * 0.22;
        const radiusY = canvas.height * 0.35;

        ctx.save();
        ctx.strokeStyle = '#3B82F6'; // Blue-500
        ctx.fillStyle = '#3B82F6';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        let arrowX = centerX;
        let arrowY = centerY;
        const offset = 40;

        ctx.beginPath();
        if (direction === 'left') {
            arrowX -= radiusX + offset;
            drawArrow(ctx, arrowX + 30, arrowY, arrowX, arrowY);
        } else if (direction === 'right') {
            arrowX += radiusX + offset;
            drawArrow(ctx, arrowX - 30, arrowY, arrowX, arrowY);
        } else if (direction === 'up') {
            arrowY -= radiusY + offset;
            drawArrow(ctx, arrowX, arrowY + 30, arrowX, arrowY);
        } else if (direction === 'down') {
            arrowY += radiusY + offset;
            drawArrow(ctx, arrowX, arrowY - 30, arrowX, arrowY);
        }
        ctx.restore();
    };

    const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
        const headLength = 20;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        // Draw main line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Draw arrow head
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    };

    const drawSyncedVideo = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const cropW = vw / ZOOM_FACTOR;
        const cropH = vh / ZOOM_FACTOR;
        const cropX = (vw - cropW) / 2;
        const cropY = (vh - cropH) / 2;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    };

    const drawLandmarksOverlay = (landmarks: any[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        drawFaceMesh(ctx, landmarks, canvas.width, canvas.height, ZOOM_FACTOR);
        ctx.restore();
    };

    const drawFaceMesh = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number, zoom: number) => {
        ctx.fillStyle = '#00FF00';
        const cropSize = 1 / zoom;
        const startOffset = (1 - cropSize) / 2;

        for (const index of [1, 33, 263, 61, 291, 152]) {
            const point = landmarks[index];
            const x = (point.x - startOffset) / cropSize;
            const y = (point.y - startOffset) / cropSize;

            if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
                ctx.beginPath();
                ctx.arc(x * width, y * height, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    };

    const calculateFaceRatios = (landmarks: any[], brightness: number): FaceRatios => {
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const mouthLeft = landmarks[61];
        const mouthRight = landmarks[291];
        const forehead = landmarks[10];
        const chin = landmarks[152];

        const dNoseLeftEye = Math.hypot(nose.x - leftEye.x, nose.y - leftEye.y);
        const dNoseRightEye = Math.hypot(nose.x - rightEye.x, nose.y - rightEye.y);
        const yawRatio = dNoseLeftEye / dNoseRightEye;

        const eyesMidY = (leftEye.y + rightEye.y) / 2;
        const mouthsMidY = (mouthLeft.y + mouthRight.y) / 2;
        const dNoseEyes = Math.abs(nose.y - eyesMidY);
        const dNoseMouth = Math.abs(nose.y - mouthsMidY);
        const pitchRatio = dNoseEyes / dNoseMouth;

        // Position Validation
        const cropSize = 1 / ZOOM_FACTOR;
        const startOffset = (1 - cropSize) / 2;

        const mappedFaceMidX = (((landmarks[33].x + landmarks[263].x) / 2) - startOffset) / cropSize;
        const mappedFaceMidY = (((forehead.y + chin.y) / 2) - startOffset) / cropSize;
        const mappedForeheadY = (forehead.y - startOffset) / cropSize;
        const mappedChinY = (chin.y - startOffset) / cropSize;

        const centerX = 0.5;
        const centerY = 0.45;
        const radX = 0.22;
        const radY = 0.35;

        const distFromCenter = Math.hypot(mappedFaceMidX - centerX, mappedFaceMidY - centerY);
        const isCentered = distFromCenter < radX * 0.8;
        const faceHeight = Math.abs(mappedForeheadY - mappedChinY);
        const isRightSize = faceHeight > radY * 1.0 && faceHeight < radY * 2.2;

        const isTooDark = brightness < 70; // Threshold for "too dark" (Stricter: increased from 40)

        let guidance = '';
        if (isTooDark) {
            guidance = 'Environment is too dark. Move to a brighter place.';
        } else if (distFromCenter > radX * 1.1) {
            guidance = 'Center your face in the frame';
        } else if (faceHeight < radY * 1.0) {
            guidance = 'Move closer to the camera';
        } else if (faceHeight > radY * 2.2) {
            guidance = 'Move a bit further away';
        }

        const isPositioned = isCentered && isRightSize && !isTooDark;

        return { yawRatio, pitchRatio, isPositioned, guidance, isTooDark };
    };

    const checkCurrentStep = (ratios: FaceRatios) => {
        const stepIndex = currentStepRef.current;
        const isProcessing = isProcessingRef.current;
        if (isProcessing || stepIndex >= steps.length) return;

        const step = steps[stepIndex];
        const isCorrect = step.check(ratios);

        // Provide verbal guidance when face is not positioned
        if (!ratios.isPositioned && ratios.guidance) {
            const now = Date.now();
            if (now - lastGuidanceSpeakRef.current > 3000 || (ratios.guidance !== lastGuidanceMsgRef.current && now - lastGuidanceSpeakRef.current > 1500)) {
                speak(ratios.guidance);
                lastGuidanceSpeakRef.current = now;
                lastGuidanceMsgRef.current = ratios.guidance;
            }
        }

        // --- Step condition passed: face must also be properly positioned ---
        if (isCorrect && ratios.isPositioned) {
            // If no countdown is running yet, start one
            if (countdownValueRef.current === null) {
                countdownValueRef.current = HOLD_SECONDS;
                setMessage(`Hold still... ${HOLD_SECONDS}`);

                countdownIntervalRef.current = setInterval(() => {
                    // Decrement first, then check — this ensures the full HOLD_SECONDS
                    // elapses before capture fires (avoids early trigger at "1").
                    const current = countdownValueRef.current;
                    if (current === null) {
                        // Safety: interval should have been cleared, bail out
                        clearInterval(countdownIntervalRef.current!);
                        return;
                    }
                    const next = current - 1;
                    if (next <= 0) {
                        // Countdown finished — execute the step action
                        clearInterval(countdownIntervalRef.current!);
                        countdownIntervalRef.current = null;
                        countdownValueRef.current = null;

                        // Only fire if still not processing (could have been reset)
                        if (isProcessingRef.current) return;
                        isProcessingRef.current = true;
                        setIsProcessing(true);

                        if (stepIndex === 0) {
                            // --- Capture frame ---
                            setMessage('📸 Capturing face...');
                            if (onCapture) {
                                const video = videoRef.current;
                                if (video) {
                                    // Draw to a clean off-screen canvas — no oval, no digit, no landmarks
                                    const offscreen = document.createElement('canvas');
                                    offscreen.width = video.videoWidth;
                                    offscreen.height = video.videoHeight;
                                    const octx = offscreen.getContext('2d');
                                    if (octx) {
                                        const vw = video.videoWidth;
                                        const vh = video.videoHeight;
                                        const cropW = vw / ZOOM_FACTOR;
                                        const cropH = vh / ZOOM_FACTOR;
                                        const cropX = (vw - cropW) / 2;
                                        const cropY = (vh - cropH) / 2;
                                        // Mirror for front camera, same as the display canvas
                                        if (facingMode === 'user') {
                                            octx.translate(offscreen.width, 0);
                                            octx.scale(-1, 1);
                                        }
                                        octx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, offscreen.width, offscreen.height);
                                        const imageSrc = offscreen.toDataURL('image/jpeg', 0.9);
                                        onCapture(imageSrc);
                                    }
                                }
                            }
                            setTimeout(() => {
                                setMessage('✓ Face Captured! Get ready...');
                                speak('Face captured. Get ready for the next step.');
                            }, 300);
                            setTimeout(() => {
                                const nextStep = stepIndex + 1;
                                currentStepRef.current = nextStep;
                                setCurrentStep(nextStep);
                                setMessage(steps[nextStep].instruction);
                                isProcessingRef.current = false;
                                setIsProcessing(false);
                            }, 2000);
                        } else {
                            // --- Head-turn step verified ---
                            setMessage(`✓ ${step.instruction} - Verified!`);
                            speak('Good!');
                            setTimeout(() => {
                                const nextStep = stepIndex + 1;
                                if (nextStep < steps.length) {
                                    currentStepRef.current = nextStep;
                                    setCurrentStep(nextStep);
                                    setMessage(steps[nextStep].instruction);
                                    isProcessingRef.current = false;
                                    setIsProcessing(false);
                                } else {
                                    setMessage('✓ Liveness check complete!');
                                    cleanup();
                                    if (onComplete) onComplete(true);
                                }
                            }, 1000);
                        }
                    } else {
                        // Still counting — update ref and message
                        countdownValueRef.current = next;
                        setMessage(`Hold still... ${next}`);
                    }
                }, 1000);
            }
            // else: countdown already running — keep waiting (face is still in position)
        } else {
            // Condition no longer met (face moved or step not satisfied): reset countdown
            if (countdownValueRef.current !== null) {
                clearCountdown();
            }
            if (!isProcessing) {
                if (!ratios.isPositioned) {
                    setMessage(ratios.guidance || 'Position your face in the frame');
                } else {
                    setMessage(step.instruction);
                }
            }
        }
    };

    const cleanup = () => {
        clearCountdown();
        if (cameraRef.current) {
            try { cameraRef.current.stop(); } catch (e) { console.warn(e); }
            cameraRef.current = null;
        }
        if (faceMeshRef.current) {
            try { faceMeshRef.current.close(); } catch (e) { console.warn(e); }
            faceMeshRef.current = null;
        }
    };

    const handleRetry = () => {
        cleanup();
        currentStepRef.current = 0;
        setCurrentStep(0);
        isProcessingRef.current = false;
        setIsProcessing(false);
        setMessage(steps[0].instruction);
        setTimeout(() => initializeFaceDetection(), 100);
    };

    useEffect(() => {
        void initializeFaceDetection();
        return () => cleanup();
    }, [facingMode]);

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full p-2 overflow-hidden">
            <div className="relative w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-xl bg-black shadow-lg">
                <video ref={videoRef} className="hidden" playsInline />
                <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />

                <button
                    onClick={toggleCamera}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all shadow-lg z-10"
                    title="Switch Camera"
                >
                    <SwitchCamera className="w-6 h-6" />
                </button>
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
