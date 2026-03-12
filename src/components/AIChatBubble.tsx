import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Sparkles, Send, Plus, MessageCircle, Clock, ChevronLeft, } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string;
}

interface ChatSummary {
    _id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

interface ChatDocument {
    _id: string;
    title: string;
    messages: { role: 'user' | 'assistant' | 'system'; content: string; createdAt: string }[];
}

// ──────────────────────────────────────────────
// Lightweight markdown renderer
// ──────────────────────────────────────────────
function parseInline(text: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    const tokenRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
        if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));

        if (match[1]) {
            nodes.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>);
        } else if (match[3]) {
            nodes.push(<em key={match.index} className="italic">{match[4]}</em>);
        } else if (match[5]) {
            nodes.push(
                <code key={match.index} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-[0.85em]">
                    {match[6]}
                </code>
            );
        } else if (match[7]) {
            nodes.push(
                <a key={match.index} href={match[8]} target="_blank" rel="noopener noreferrer"
                    className="underline underline-offset-2 text-green-700 hover:text-green-900 transition-colors">
                    {match[7]}
                </a>
            );
        }

        lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
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

        if (line.trim().startsWith('```')) {
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
            i++;
            continue;
        }

        const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const sizeClass = level === 1 ? 'text-base font-bold' : level === 2 ? 'text-sm font-bold' : 'text-sm font-semibold';
            elements.push(<p key={i} className={`${sizeClass} mt-2 mb-0.5`}>{parseInline(headingMatch[2])}</p>);
            i++;
            continue;
        }

        const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)/);
        if (bulletMatch) {
            const listItems: React.ReactNode[] = [];
            while (i < lines.length && lines[i].match(/^(\s*)[-*]\s+(.+)/)) {
                const m = lines[i].match(/^(\s*)[-*]\s+(.+)/)!;
                listItems.push(
                    <li key={i} className="flex items-start gap-1.5">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-green-500" />
                        <span>{parseInline(m[2])}</span>
                    </li>
                );
                i++;
            }
            elements.push(<ul key={`ul-${i}`} className="space-y-1 my-1 text-sm">{listItems}</ul>);
            continue;
        }

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
            elements.push(<ol key={`ol-${i}`} className="space-y-1 my-1 text-sm">{listItems}</ol>);
            continue;
        }

        if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
            elements.push(<hr key={i} className="my-2 border-0 h-px bg-gray-200" />);
            i++;
            continue;
        }

        if (line.trim() === '') {
            if (elements.length > 0) elements.push(<div key={i} className="h-1.5" />);
            i++;
            continue;
        }

        elements.push(<p key={i} className="text-sm leading-relaxed">{parseInline(line)}</p>);
        i++;
    }

    return <div className="space-y-0.5">{elements}</div>;
}

// ──────────────────────────────────────────────
// Group chats by date
// ──────────────────────────────────────────────
function groupChatsByDate(chats: ChatSummary[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: { label: string; chats: ChatSummary[] }[] = [
        { label: 'Today', chats: [] },
        { label: 'Yesterday', chats: [] },
        { label: 'Last 7 Days', chats: [] },
        { label: 'Older', chats: [] },
    ];

    for (const chat of chats) {
        const d = new Date(chat.updatedAt);
        d.setHours(0, 0, 0, 0);
        if (d >= today) groups[0].chats.push(chat);
        else if (d >= yesterday) groups[1].chats.push(chat);
        else if (d >= lastWeek) groups[2].chats.push(chat);
        else groups[3].chats.push(chat);
    }

    return groups.filter(g => g.chats.length > 0);
}

export function AIChatBubble() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [chats, setChats] = useState<ChatSummary[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am **SAI — Smartapps AI**. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [size, setSize] = useState({ width: 420, height: 620 });
    const isResizingRef = useRef(false);
    const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            const deltaX = resizeStartRef.current.x - e.clientX;
            const deltaY = resizeStartRef.current.y - e.clientY;
            setSize({
                width: Math.max(380, Math.min(800, resizeStartRef.current.width + deltaX)),
                height: Math.max(450, Math.min(900, resizeStartRef.current.height + deltaY))
            });
        };
        const handleMouseUp = () => { isResizingRef.current = false; };
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
        resizeStartRef.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen, isMinimized]);

    const fetchChats = async () => {
        try {
            const res = await api.get('/ai/chats');
            const data = res.data?.data || [];
            setChats(Array.isArray(data) ? data : []);
        } catch (e) { /* ignore */ }
    };

    const loadChat = async (id: string) => {
        try {
            setIsLoading(true);
            const res = await api.get(`/ai/chats/${id}`);
            const chat: ChatDocument = res.data?.data;
            if (chat && Array.isArray(chat.messages)) {
                const mapped = chat.messages.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content,
                    createdAt: m.createdAt
                } as Message));
                setMessages(mapped.length > 0 ? mapped : [{ role: 'assistant', content: 'New conversation started.' }]);
                setCurrentChatId(chat._id);
                setIsSidebarOpen(false);
            }
        } catch (e) { /* ignore */ }
        finally { setIsLoading(false); }
    };

    const formatTime = (iso?: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatRelativeDate = (iso: string) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const handleCopy = async (text: string, idx: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIdx(idx);
            window.setTimeout(() => setCopiedIdx(v => (v === idx ? null : v)), 1200);
        } catch { setCopiedIdx(null); }
    };

    const startNewChat = () => {
        setCurrentChatId(null);
        setMessages([{ role: 'assistant', content: 'New conversation started. What would you like to explore?' }]);
        setInput('');
        setIsSidebarOpen(false);
    };

    useEffect(() => {
        if (isOpen) fetchChats();
    }, [isOpen]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage, createdAt: new Date().toISOString() }]);
        setIsLoading(true);

        try {
            let chatId = currentChatId;
            if (!chatId) {
                const created = await api.post('/ai/chats', { firstMessage: userMessage });
                chatId = created.data?.data?.id;
                setCurrentChatId(chatId || null);
                await fetchChats();
            }
            const response = await api.post(`/ai/chats/${chatId}/messages`, { message: userMessage });
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data?.response,
                createdAt: new Date().toISOString()
            }]);
            fetchChats();
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                createdAt: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const retryLast = async () => {
        if (isLoading) return;
        const lastUser = [...messages].reverse().find(m => m.role === 'user');
        if (!lastUser) return;
        setIsLoading(true);
        try {
            let chatId = currentChatId;
            if (!chatId) {
                const created = await api.post('/ai/chats', { firstMessage: lastUser.content.slice(0, 60) });
                chatId = created.data?.data?.id;
                setCurrentChatId(chatId || null);
                await fetchChats();
            }
            const response = await api.post(`/ai/chats/${chatId}/messages`, { message: lastUser.content });
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data?.response,
                createdAt: new Date().toISOString()
            }]);
            fetchChats();
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Retry failed. Please try again.',
                createdAt: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const currentChat = chats.find(c => c._id === currentChatId);
    const groupedChats = groupChatsByDate(chats);

    if (!user) return null;

    const SIDEBAR_WIDTH = 240;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
            {isOpen && (
                <div
                    className={`
                        bg-white rounded-3xl border border-gray-200 overflow-hidden
                        transition-all duration-300 ease-out flex flex-col relative
                        ${isMinimized ? 'w-80 h-16 rounded-2xl' : 'shadow-lg'}
                    `}
                    style={!isMinimized ? { width: size.width, height: size.height } : undefined}
                >
                    {/* ── Header ── */}
                    <div
                        className={`
                            relative flex items-center justify-between px-4 py-3 flex-shrink-0
                            ${isMinimized ? 'h-full bg-green-50 cursor-pointer' : 'bg-white border-b border-gray-100'}
                        `}
                        onClick={isMinimized ? () => setIsMinimized(false) : undefined}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            {/* Sidebar toggle */}
                            {!isMinimized && (
                                <button
                                    onClick={() => setIsSidebarOpen(v => !v)}
                                    className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isSidebarOpen ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
                                    title="Chat history"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </button>
                            )}

                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                                <Sparkles className="h-3.5 w-3.5" />
                            </div>

                            <div className="flex flex-col min-w-0">
                                <span className="text-gray-900 font-semibold text-sm leading-none">
                                    {currentChat ? (
                                        <span className="truncate block max-w-[140px]" title={currentChat.title}>
                                            {currentChat.title}
                                        </span>
                                    ) : 'SAI — Smartapps AI'}
                                </span>
                                {!isMinimized && (
                                    <span className="text-green-600 text-[10px] font-medium flex items-center gap-1 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Online
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-0.5 text-gray-400 flex-shrink-0">
                            {!isMinimized && (
                                <button
                                    onClick={startNewChat}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-green-600"
                                    title="New chat"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsMinimized(v => !v)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                title={isMinimized ? "Expand" : "Minimize"}
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── Body (sidebar + chat) ── */}
                    {!isMinimized && (
                        <div className="flex-1 flex overflow-hidden relative">
                            
                            {/* ── Collapsible Sidebar ── */}
                            <div
                                className="flex-shrink-0 bg-gray-50 border-r border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
                                style={{ width: isSidebarOpen ? SIDEBAR_WIDTH : 0 }}
                            >
                                {/* Sidebar inner — always rendered, just clipped */}
                                <div style={{ width: SIDEBAR_WIDTH }} className="flex flex-col h-full">
                                    {/* Sidebar header */}
                                    <div className="px-3 pt-3 pb-2 flex items-center justify-between flex-shrink-0">
                                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">History</span>
                                        <button
                                            onClick={startNewChat}
                                            className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded-md hover:bg-green-50 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            New
                                        </button>
                                    </div>

                                    {/* Chat list */}
                                    <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-4">
                                        {chats.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-center px-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                                    <MessageSquare className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <p className="text-[11px] text-gray-400 leading-relaxed">No conversations yet. Start chatting!</p>
                                            </div>
                                        ) : (
                                            groupedChats.map(group => (
                                                <div key={group.label}>
                                                    <div className="flex items-center gap-1.5 px-1 mb-1.5">
                                                        <Clock className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</span>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {group.chats.map(chat => (
                                                            <button
                                                                key={chat._id}
                                                                onClick={() => loadChat(chat._id)}
                                                                className={`
                                                                    w-full text-left rounded-xl px-2.5 py-2 transition-all group/item
                                                                    ${currentChatId === chat._id
                                                                        ? 'bg-green-50 border border-green-100'
                                                                        : 'hover:bg-white hover:border hover:border-gray-200 border border-transparent'}
                                                                `}
                                                            >
                                                                <div className="flex items-start justify-between gap-1">
                                                                    <p className={`text-[12px] leading-snug truncate font-medium ${currentChatId === chat._id ? 'text-green-800' : 'text-gray-700'}`}>
                                                                        {chat.title}
                                                                    </p>
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 mt-0.5">{formatRelativeDate(chat.updatedAt)}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Sidebar collapse tab ── */}
                            {isSidebarOpen && (
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="absolute left-[240px] top-1/2 -translate-y-1/2 z-10 w-5 h-10 bg-white border border-gray-200 rounded-r-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                    title="Collapse history"
                                >
                                    <ChevronLeft className="w-3 h-3" />
                                </button>
                            )}

                            {/* ── Main Chat Area ── */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                    {messages.map((msg, idx) => {
                                        const prev = idx > 0 ? messages[idx - 1] : null;
                                        const showAvatar = msg.role === 'assistant' && prev?.role !== 'assistant';
                                        const showMeta = prev?.role !== msg.role;
                                        const isUser = msg.role === 'user';
                                        const time = formatTime(msg.createdAt);

                                        return (
                                            <div key={idx} className={`group flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                                                {!isUser && (
                                                    <div className="w-7 flex-shrink-0">
                                                        {showAvatar ? (
                                                            <div className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center mt-1 border border-green-100">
                                                                <Sparkles className="h-3.5 w-3.5" />
                                                            </div>
                                                        ) : <div className="w-7 h-7" />}
                                                    </div>
                                                )}

                                                <div className={`min-w-0 flex flex-col max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
                                                    {showMeta && (
                                                        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                                                            <span className="text-[10px] font-medium text-gray-500">
                                                                {isUser ? 'You' : 'SAI'}
                                                            </span>
                                                            {time && <span className="text-[10px] text-gray-400">{time}</span>}
                                                            {!isUser && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCopy(msg.content, idx)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-400 hover:text-gray-700"
                                                                >
                                                                    {copiedIdx === idx ? '✓ Copied' : 'Copy'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className={
                                                        `rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ` +
                                                        (isUser
                                                            ? 'bg-[#e6f4ea] text-gray-900 rounded-tr-sm'
                                                            : 'bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100')
                                                    }>
                                                        <MarkdownContent content={msg.content} isUser={isUser} />
                                                        {!isUser && msg.content === 'I could not generate a response at the moment. Please try again.' && (
                                                            <div className="mt-2">
                                                                <button
                                                                    type="button"
                                                                    disabled={isLoading}
                                                                    onClick={retryLast}
                                                                    className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                                >
                                                                    Retry
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {isUser && <div className="w-7 flex-shrink-0" />}
                                            </div>
                                        );
                                    })}

                                    {isLoading && (
                                        <div className="flex items-start gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 mt-1 border border-green-100">
                                                <Sparkles className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="px-4 py-3 bg-gray-50 rounded-2xl rounded-tl-sm border border-gray-100">
                                                <div className="flex gap-1.5">
                                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-50">
                                    <form
                                        onSubmit={handleSendMessage}
                                        className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-green-100 focus-within:bg-white border border-transparent focus-within:border-green-200"
                                    >
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            placeholder="Ask anything..."
                                            className="flex-1 bg-transparent border-none text-gray-900 text-sm focus:ring-0 outline-none placeholder-gray-400"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!input.trim() || isLoading}
                                            className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                        </button>
                                    </form>
                                    <div className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                                        <Sparkles className="h-2.5 w-2.5" />
                                        <span>Powered by Gemini Pro</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resize handle */}
                    {!isMinimized && (
                        <div
                            className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-50 flex items-center justify-center group/resize"
                            onMouseDown={handleMouseDown}
                            title="Drag to resize"
                        >
                            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-gray-300 group-hover/resize:border-green-500 transition-colors rounded-tl-sm" />
                        </div>
                    )}
                </div>
            )}

            {/* Toggle button */}
            {!isOpen && (
                <button
                    onClick={() => { setIsOpen(true); setIsMinimized(false); }}
                    className="group flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
                >
                    <MessageSquare className="h-6 w-6" />
                </button>
            )}
        </div>
    );
}
