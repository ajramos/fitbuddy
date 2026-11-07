'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from "@/components/providers/language-provider";
import { RotateCcw, Check, X, Loader2 } from 'lucide-react';
import SnakeGame from '@/components/games/snake';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export default function CoachChat() {
    const { data: session } = useSession();
    const router = useRouter();
    const { dict } = useLanguage();

    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: dict.coach.welcome }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [planReady, setPlanReady] = useState(false);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isLoadingConversation, setIsLoadingConversation] = useState(true);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, isGeneratingPlan]);

    // Load or create conversation on mount
    useEffect(() => {
        const initConversation = async () => {
            try {
                const res = await fetch('/api/coach/conversation');
                const data = await res.json();

                if (data.conversation) {
                    setConversationId(data.conversation.id);
                    if (data.conversation.messages && data.conversation.messages.length > 0) {
                        setMessages([
                            { role: 'model', text: dict.coach.welcome },
                            ...data.conversation.messages
                        ]);
                    }
                    console.log('[Chat] Loaded existing conversation:', data.conversation.id);
                } else {
                    const createRes = await fetch('/api/coach/conversation', { method: 'POST' });
                    const createData = await createRes.json();
                    setConversationId(createData.conversationId);
                    console.log('[Chat] Created new conversation:', createData.conversationId);
                }
            } catch (error) {
                console.error('[Chat] Failed to init conversation:', error);
            } finally {
                setIsLoadingConversation(false);
            }
        };

        initConversation();
    }, []);

    // Focus on mount and when loading finishes
    useEffect(() => {
        if (!isLoading && !isLoadingConversation) {
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isLoading, isLoadingConversation]);

    const generatePlan = async () => {
        setIsLoading(true);
        setIsGeneratingPlan(true);
        try {
            const res = await fetch('/api/plan/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId })
            });
            const data = await res.json();
            if (data.planId) {
                router.push('/plan/' + data.planId);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to generate plan');
            setIsGeneratingPlan(false);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || !conversationId) return;

        const newMessages = [...messages, { role: 'user', text } as Message];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const res = await fetch('/api/coach/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history,
                    conversationId
                })
            });

            if (!res.ok) throw new Error('Failed to send message');

            const data = await res.json();

            if (data.message) {
                setMessages(prev => [...prev, { role: 'model', text: data.message }]);
            }

            if (data.state === 'ready') {
                setPlanReady(true);
                // Auto-generate plan immediately
                await generatePlan();
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: dict.coach.errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleRecording = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Speech recognition not supported in this browser.');
            return;
        }

        if (isRecording) {
            setIsRecording(false);
            return;
        }

        setIsRecording(true);
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsRecording(false);
        };

        recognition.onerror = () => {
            setIsRecording(false);
        };

        recognition.start();
    };

    const resetConversation = async () => {
        setIsLoading(true);
        try {
            const createRes = await fetch('/api/coach/conversation', { method: 'POST' });
            if (!createRes.ok) throw new Error('API Failed');

            const createData = await createRes.json();
            setConversationId(createData.conversationId);
            setMessages([{ role: 'model', text: dict.coach.welcome }]);
            setPlanReady(false);
            setIsGeneratingPlan(false);
            setInput('');
            setShowResetConfirm(false);
            console.log('Conversation reset successfully');
        } catch (error) {
            console.error('Failed to reset conversation', error);
            alert(dict.coach.errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-4 shrink-0 transition-all">
                <h1 className="text-2xl font-bold text-slate-800">{dict.coach.title}</h1>

                {showResetConfirm ? (
                    <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 animate-in fade-in slide-in-from-right-5 duration-200">
                        <span className="text-xs font-semibold text-red-600 mr-1">{dict.coach.resetConfirm || 'Restart?'}</span>
                        <button
                            onClick={resetConversation}
                            disabled={isLoading}
                            className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition shadow-sm"
                            title="Confirm Reset"
                        >
                            <Check size={16} />
                        </button>
                        <button
                            onClick={() => setShowResetConfirm(false)}
                            className="p-1 bg-white text-slate-500 border border-slate-200 rounded-md hover:bg-slate-100 transition shadow-sm"
                            title="Cancel"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        disabled={isLoading}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
                        title={dict.coach.newPlan}
                    >
                        <RotateCcw size={16} />
                        <span>{dict.coach.newPlan || 'New Plan'}</span>
                    </button>
                )}
            </div>

            <div className="flex flex-col h-full w-full max-w-3xl mx-auto border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                    {messages.map((m, idx) => (
                        <div
                            key={idx}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl shadow-sm ${m.role === 'user'
                                        ? 'bg-blue-600 text-white px-5 py-3.5'
                                        : 'bg-white border border-gray-200 text-slate-800 px-5 py-4'
                                    }`}
                            >
                                <div
                                    className={`prose prose-sm max-w-none ${m.role === 'user'
                                            ? 'prose-invert prose-p:my-1.5 prose-li:my-0.5'
                                            : 'prose-slate prose-p:my-2 prose-li:my-1 prose-headings:mt-4 prose-headings:mb-2'
                                        }`}
                                >
                                    <ReactMarkdown>{m.text}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-2xl px-4 py-2 flex space-x-1 items-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {isGeneratingPlan && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col items-center animate-in slide-in-from-bottom-5 duration-500">
                        <div className="flex flex-col items-center mb-6 text-center">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-lg mb-2">
                                <Loader2 className="animate-spin" size={24} />
                                <span>Generating your perfect plan...</span>
                            </div>
                            <p className="text-slate-500 text-sm">
                                This usually takes about 1-2 minutes. Play a quick game while you wait! 🐍
                            </p>
                        </div>
                        <SnakeGame />
                    </div>
                )}

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2 items-center">
                    <button
                        onClick={toggleRecording}
                        className={`p-3 rounded-full transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        title="Voice Input"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                        placeholder={isRecording ? "Listening..." : dict.coach.placeholder}
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </div>
        </>
    );
}
