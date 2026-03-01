import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Sparkles, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// ──────────────────────────────────────────────
// Lightweight markdown renderer (no dependencies)
// Handles: **bold**, *italic*, `code`, ```code blocks```,
//          # headings, - / * bullet lists, numbered lists,
//          [text](url) links, and line breaks.
// ──────────────────────────────────────────────
function parseInline(text: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    // Combined regex for inline tokens: bold, italic, inline code, links
    const tokenRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        if (match[1]) {
            // **bold**
            nodes.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>);
        } else if (match[3]) {
            // *italic*
            nodes.push(<em key={match.index} className="italic">{match[4]}</em>);
        } else if (match[5]) {
            // `inline code`
            nodes.push(
                <code key={match.index} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-[0.85em]">
                    {match[6]}
                </code>
            );
        } else if (match[7]) {
            // [text](url)
            nodes.push(
                <a key={match.index} href={match[8]} target="_blank" rel="noopener noreferrer"
                    className="underline underline-offset-2 text-green-700 hover:text-green-900 transition-colors">
                    {match[7]}
                </a>
            );
        }

        lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}

interface MarkdownProps {
    content: string;
    isUser?: boolean;
}

function MarkdownContent({ content, isUser = false }: MarkdownProps) {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Fenced code block ```
        if (line.trim().startsWith('```')) {
            // const lang = line.trim().slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push(
                <pre key={i} className={`rounded-lg p-3 mt-1 mb-1 overflow-x-auto text-xs font-mono leading-relaxed ${isUser ? 'bg-green-200/50 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                    <code>{codeLines.join('\n')}</code>
                </pre>
            );
            i++; // skip closing ```
            continue;
        }

        // Heading #
        const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2];
            const sizeClass = level === 1 ? 'text-base font-bold' : level === 2 ? 'text-sm font-bold' : 'text-sm font-semibold';
            elements.push(
                <p key={i} className={`${sizeClass} mt-2 mb-0.5`}>
                    {parseInline(text)}
                </p>
            );
            i++;
            continue;
        }

        // Bullet list item - or *
        const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)/);
        if (bulletMatch) {
            const listItems: React.ReactNode[] = [];
            while (i < lines.length && lines[i].match(/^(\s*)[-*]\s+(.+)/)) {
                const m = lines[i].match(/^(\s*)[-*]\s+(.+)/)!;
                listItems.push(
                    <li key={i} className="flex items-start gap-1.5">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-green-500`} />
                        <span>{parseInline(m[2])}</span>
                    </li>
                );
                i++;
            }
            elements.push(
                <ul key={`ul-${i}`} className="space-y-1 my-1 text-sm">
                    {listItems}
                </ul>
            );
            continue;
        }

        // Numbered list item
        const numberedMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
        if (numberedMatch) {
            const listItems: React.ReactNode[] = [];
            let num = 1;
            while (i < lines.length && lines[i].match(/^(\s*)\d+\.\s+(.+)/)) {
                const m = lines[i].match(/^(\s*)\d+\.\s+(.+)/)!;
                listItems.push(
                    <li key={i} className="flex items-start gap-2">
                        <span className="flex-shrink-0 font-semibold text-xs mt-0.5 text-green-600">{num}.</span>
                        <span>{parseInline(m[2])}</span>
                    </li>
                );
                i++;
                num++;
            }
            elements.push(
                <ol key={`ol-${i}`} className="space-y-1 my-1 text-sm">
                    {listItems}
                </ol>
            );
            continue;
        }

        // Horizontal rule
        if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
            elements.push(<hr key={i} className="my-2 border-0 h-px bg-gray-200" />);
            i++;
            continue;
        }

        // Empty line → small spacer
        if (line.trim() === '') {
            // Only add spacing if there are already elements
            if (elements.length > 0) {
                elements.push(<div key={i} className="h-1.5" />);
            }
            i++;
            continue;
        }

        // Regular paragraph
        elements.push(
            <p key={i} className="text-sm leading-relaxed">
                {parseInline(line)}
            </p>
        );
        i++;
    }

    return <div className="space-y-0.5">{elements}</div>;
}

export function AIChatBubble() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    
    // Chat state
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your **Smart Verify AI** assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Resizing state
    const [size, setSize] = useState({ width: 400, height: 600 });
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isMinimized]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await api.post('/ai/chat', { message: userMessage });
            const aiResponse = response.data.response;
            
            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Sorry, I encountered an error while processing your request. Please try again.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div 
                    className={`
                        bg-white rounded-3xl border border-gray-200 overflow-hidden
                        transition-all duration-300 ease-out flex flex-col relative
                        ${isMinimized ? 'w-80 h-16 rounded-2xl' : 'shadow-sm'}
                    `}
                    style={!isMinimized ? { width: size.width, height: size.height } : undefined}
                >
                    {/* Header */}
                    <div 
                        className={`
                            relative flex items-center justify-between px-5 py-4 cursor-pointer group flex-shrink-0
                            ${isMinimized ? 'h-full bg-green-50' : 'bg-white border-b border-gray-100'}
                        `}
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            
                            <div className="flex flex-col">
                                <span className="text-gray-900 font-semibold text-sm">
                                    AI Assistant
                                </span>
                                {!isMinimized && (
                                    <span className="text-green-600 text-[11px] font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Online
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1 text-gray-400">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                title={isMinimized ? "Expand" : "Minimize"}
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`flex-1 bg-white flex flex-col relative overflow-hidden ${isMinimized ? 'hidden' : 'flex'}`}>
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            {messages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Sparkles className="h-4 w-4" />
                                        </div>
                                    )}
                                    
                                    <div className={`
                                        max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed
                                        ${msg.role === 'assistant' 
                                            ? 'bg-gray-100 text-gray-800 rounded-tl-sm' 
                                            : 'bg-[#e6f4ea] text-gray-900 rounded-tr-sm'
                                        }
                                    `}>
                                        <MarkdownContent
                                            content={msg.content}
                                            isUser={msg.role === 'user'}
                                        />
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                    <div className="px-5 py-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-5 bg-white">
                            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2 bg-gray-100 rounded-full px-2 py-2 transition-all focus-within:ring-2 focus-within:ring-green-100 focus-within:bg-white border border-transparent focus-within:border-green-200">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask anything..."
                                    className="flex-1 bg-transparent border-none text-gray-900 text-sm focus:ring-0 block w-full pl-3 outline-none placeholder-gray-500"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="p-2.5 bg-white text-green-600 rounded-full hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="h-4 w-4 fill-current" />
                                </button>
                            </form>
                            <div className="text-[10px] text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                <span>Powered by Gemini Pro</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Resize Handle - Top Left Corner */}
                    {!isMinimized && (
                        <div 
                            className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-50 flex items-center justify-center group/resize"
                            onMouseDown={handleMouseDown}
                            title="Drag to resize"
                        >
                            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-gray-300 group-hover/resize:border-green-500 transition-colors rounded-tl-sm"></div>
                        </div>
                    )}
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => { 
                        setIsOpen(true); 
                        setIsMinimized(false); 
                    }}
                    className="group flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                >
                    <MessageSquare className="h-6 w-6" />
                </button>
            )}
        </div>
    );
}