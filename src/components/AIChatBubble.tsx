import { useState, useMemo, useEffect, useRef } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Modern green color palette
const GREEN = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e', // Primary - fresh, modern green
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
};

export function AIChatBubble() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Resizing state
    const [size, setSize] = useState({ width: 500, height: 700 });
    const isResizingRef = useRef(false);
    const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            
            const deltaX = resizeStartRef.current.x - e.clientX;
            const deltaY = resizeStartRef.current.y - e.clientY;

            setSize({
                width: Math.max(350, Math.min(800, resizeStartRef.current.width + deltaX)),
                height: Math.max(400, Math.min(900, resizeStartRef.current.height + deltaY))
            });
        };

        const handleMouseUp = () => {
            isResizingRef.current = false;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizingRef.current = true;
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height
        };
    };

    const iframeUrl = useMemo(() => {
        if (!user?.service_id) return '';
        
        return `https://smartverify-ai.vercel.app/#/?service_name=${encodeURIComponent(user.service_id)}`;
    }, [user]);

    // Handle click outside to close? (Optional - uncomment if desired)
    // useEffect(() => {
    //     const handleClickOutside = (event: MouseEvent) => {
    //         if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node) &&
    //             buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
    //             setIsOpen(false);
    //         }
    //     };
    //     document.addEventListener('mousedown', handleClickOutside);
    //     return () => document.removeEventListener('mousedown', handleClickOutside);
    // }, []);

    // Simulate new message notification when closed
    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => setHasNewMessage(true), 30000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Tooltip */}
            {!isOpen && showTooltip && (
                <div 
                    className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 relative animate-fadeIn mb-1"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <Sparkles className="h-3.5 w-3.5 text-[#22c55e] inline mr-1.5 -mt-0.5" />
                    Need help? Ask our AI assistant
                    <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div 
                    ref={chatWindowRef}
                    className={`
                        bg-white rounded-2xl border border-gray-200 overflow-hidden
                        transition-all duration-300 ease-out flex flex-col relative
                        ${isMinimized ? 'w-80 h-14' : ''}
                    `}
                    style={!isMinimized ? { width: size.width, height: size.height } : undefined}
                >
                    {/* Header */}
                    <div 
                        className="relative flex items-center justify-between px-5 h-14 cursor-pointer group flex-shrink-0"
                        onClick={() => setIsMinimized(!isMinimized)}
                        style={{ backgroundColor: GREEN[500] }}
                    >
                        {/* Gradient overlay for depth without shadow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                        
                        <div className="flex items-center gap-3 relative z-10">
                            {/* Animated status dot */}
                            <div className="relative">
                                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-white animate-ping opacity-75" />
                            </div>
                            
                            <div className="flex flex-col">
                                <span className="text-white font-semibold text-sm tracking-wide">
                                    Smart Verify AI
                                </span>
                                <span className="text-white/80 text-[10px] font-medium">
                                    Online • Ready to help
                                </span>
                            </div>
                        </div>
                        
                        {/* Drag Handle (for moving if we implement moving later, but requested is resize) 
                            Actually, usually resize handle is at corner. 
                            Let's add a resize handle at the top-left corner since it's bottom-right anchored.
                        */}

                        <div className="flex items-center gap-1 relative z-10">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                                title={isMinimized ? "Expand" : "Minimize"}
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`w-full flex-1 bg-gray-50/50 relative ${isMinimized ? 'hidden' : 'block'}`}>
                        {/* Subtle top border */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                        
                        {iframeUrl ? (
                            <iframe 
                                src={iframeUrl}
                                className="w-full h-full border-none"
                                title="Smart Verify AI Assistant"
                                allow="microphone"
                                loading="lazy"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
                                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-[#22c55e]/10 to-[#16a34a]/10 flex items-center justify-center">
                                    <MessageSquare className="h-8 w-8 text-[#22c55e]" />
                                </div>
                                <p className="font-medium text-gray-700 mb-2">Unable to load AI Assistant</p>
                                <p className="text-sm text-gray-400 max-w-[200px]">Missing service information. Please try again later.</p>
                            </div>
                        )}
                        
                        {/* Subtle footer gradient */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50/50 to-transparent pointer-events-none" />
                    </div>
                    
                    {/* Resize Handle - Top Left Corner */}
                    {!isMinimized && (
                        <div 
                            className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-50 flex items-center justify-center group/resize"
                            onMouseDown={handleMouseDown}
                            title="Drag to resize"
                        >
                            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-white/50 group-hover/resize:border-white transition-colors rounded-tl-sm"></div>
                        </div>
                    )}
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    ref={buttonRef}
                    onClick={() => { 
                        setIsOpen(true); 
                        setIsMinimized(false); 
                        setHasNewMessage(false);
                        setShowTooltip(false);
                    }}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="relative group flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{ backgroundColor: GREEN[500] }}
                >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] skew-x-[-20deg]" />
                    
                    {/* Notification dot */}
                    {hasNewMessage && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#22c55e] border-2 border-white"></span>
                        </span>
                    )}
                    
                    <MessageSquare className="h-5 w-5 text-white relative z-10" />
                    <span className="font-medium text-sm text-white pr-1 relative z-10">Ask AI Assistant</span>
                    
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 rounded-full border border-white/20 group-hover:border-white/30 transition-colors" />
                </button>
            )}

            {/* Add animation styles */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}