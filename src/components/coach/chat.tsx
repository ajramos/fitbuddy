'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from "@/components/providers/language-provider";

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
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isLoadingConversation, setIsLoadingConversation] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    // Load or create conversation on mount
    useEffect(() => {
        const initConversation = async () => {
            try {
                // Try to get active conversation
                const res = await fetch('/api/coach/conversation');
                const data = await res.json();

                if (data.conversation) {
                    // Load existing conversation
                    setConversationId(data.conversation.id);
                    if (data.conversation.messages && data.conversation.messages.length > 0) {
                        setMessages([
                            { role: 'model', text: dict.coach.welcome },
                            ...data.conversation.messages
                        ]);
                    }
                    console.log('[Chat] Loaded existing conversation:', data.conversation.id);
                } else {
                    // Create new conversation
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
            // Small timeout to ensure disabled attribute is removed
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isLoading, isLoadingConversation]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || !conversationId) return;

        const newMessages = [...messages, { role: 'user', text } as Message];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        // ... rest of logic

        try {
            // Convert UI messages to Vertex AI History format content
            // Simple mapping: 
            // model -> role: 'model', parts: [{ text }]
            // user -> role: 'user', parts: [{ text }]
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
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: dict.coach.errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const generatePlan = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/plan/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId })
            });
            const data = await res.json();
            if (data.planId) {
                router.push(`/ plan / ${data.planId} `);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to generate plan');
        } finally {
            setIsLoading(false);
        }
    };

    // Simple Speech Recognition Stub
    const toggleRecording = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Speech recognition not supported in this browser.');
            return;
        }

        if (isRecording) {
            // Stop logic managed by end event usually, but here we toggle manually
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





    return (
        <>
            <h1 className="text-2xl font-bold text-slate-800 mb-4 shrink-0">{dict.coach.title}</h1>
            <div className="flex flex-col h-full w-full max-w-3xl mx-auto border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} `}>
                            <div className={`max - w - [80 %] rounded - 2xl px - 4 py - 2 ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                } `}>
                                {m.role === 'model' ? (
                                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-gray-900 prose-li:text-gray-900 prose-strong:text-gray-900 text-gray-900">
                                        <ReactMarkdown>{m.text}</ReactMarkdown>
                                    </div>
                                ) : (
                                    m.text
                                )}
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

                {planReady && (
                    <div className="p-4 bg-green-50 border-t border-green-100 flex justify-center">
                        <button
                            onClick={generatePlan}
                            disabled={isLoading}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition transform hover:scale-105"
                        >
                            {isLoading ? dict.coach.generatingPlan : `${dict.coach.viewPlan} 🚀`}
                        </button>
                    </div>
                )}

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2 items-center">
                    <button
                        onClick={toggleRecording}
                        className={`p - 3 rounded - full transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} `}
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
            </div >
        </>
    );
}
