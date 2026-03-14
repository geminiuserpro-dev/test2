import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, Sparkles, Code2, Eye, ChevronLeft, ChevronRight,
    Zap, Terminal, Globe, Lock, GitBranch, Plus, Search,
    FileCode, Layers, Settings, Play, RefreshCw, ExternalLink,
    AlertTriangle, CheckCircle2, Loader2, Smartphone, Monitor,
    Tablet, X, History, Paintbrush, Download
} from "lucide-react";
import { sendChat, generateApp } from "../hooks/useApi";
import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/ChatPanel";
import PreviewPane from "../components/PreviewPane";
import ToolBar from "../components/ToolBar";

export type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    streaming?: boolean;
    timestamp: Date;
};

export type Project = {
    id: string;
    name: string;
    files: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
};

type ViewMode = "split" | "chat" | "preview";
type DevicePreset = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<DevicePreset, number> = {
    desktop: 1280, tablet: 768, mobile: 390,
};

export default function WorkspacePage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hi! I'm buildfast — I create and modify web applications in real-time.\n\nDescribe what you want to build and I'll get started. You can see the live preview on the right as I work.",
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("split");
    const [device, setDevice] = useState<DevicePreset>("desktop");
    const [previewUrl, setPreviewUrl] = useState("http://localhost:5173");
    const [project] = useState<Project>({
        id: crypto.randomUUID(),
        name: "My App",
        files: {},
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + "px";
        }
    }, [input]);

    const sendMessage = useCallback(async () => {
        if (!input.trim() || isGenerating) return;
        const userMsg: Message = {
            id: crypto.randomUUID(), role: "user",
            content: input.trim(), timestamp: new Date(),
        };
        const assistantId = crypto.randomUUID();
        const assistantMsg: Message = {
            id: assistantId, role: "assistant",
            content: "", streaming: true, timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg, assistantMsg]);
        setInput("");
        setIsGenerating(true);

        try {
            const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
            await sendChat({
                messages: allMessages,
                existingFiles: project.files,
                onChunk: (_, full) => {
                    setMessages(prev => prev.map(m =>
                        m.id === assistantId ? { ...m, content: full, streaming: true } : m
                    ));
                },
            });
            setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, streaming: false } : m
            ));
        } catch (err) {
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`, streaming: false }
                    : m
            ));
        } finally {
            setIsGenerating(false);
        }
    }, [input, isGenerating, messages, project.files]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            {/* Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 220, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                        className="flex-shrink-0 overflow-hidden border-r border-sidebar-border"
                    >
                        <Sidebar project={project} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Top toolbar */}
                <ToolBar
                    project={project}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    device={device}
                    setDevice={setDevice}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    previewUrl={previewUrl}
                    isGenerating={isGenerating}
                />

                {/* Editor area */}
                <div className="flex flex-1 min-h-0">
                    {/* Chat panel */}
                    <AnimatePresence initial={false}>
                        {(viewMode === "split" || viewMode === "chat") && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className={`flex flex-col border-r border-border ${viewMode === "split" ? "w-[420px] flex-shrink-0" : "flex-1"
                                    }`}
                            >
                                <ChatPanel messages={messages} isGenerating={isGenerating} />

                                {/* Input area */}
                                <div className="p-3 border-t border-border bg-background">
                                    {/* Suggestion chips */}
                                    {messages.length === 1 && (
                                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                                            {[
                                                "Build a todo app",
                                                "Create a landing page",
                                                "Make a dashboard",
                                                "Add authentication",
                                            ].map(suggestion => (
                                                <button
                                                    key={suggestion}
                                                    onClick={() => setInput(suggestion)}
                                                    className="px-2.5 py-1 text-xs rounded-full border border-border bg-card hover:bg-accent hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="relative flex items-end gap-2 bg-card rounded-xl border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Describe what you want to build or change…"
                                            rows={1}
                                            disabled={isGenerating}
                                            className="flex-1 resize-none bg-transparent px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none min-h-[44px] max-h-[160px] disabled:opacity-50"
                                        />
                                        <div className="flex items-center gap-1 p-2">
                                            <button
                                                onClick={sendMessage}
                                                disabled={!input.trim() || isGenerating}
                                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                                            >
                                                {isGenerating
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Send className="w-4 h-4" />
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    <p className="mt-1.5 text-[11px] text-muted-foreground/50 text-center">
                                        ↵ to send · ⇧↵ new line · buildfast v5
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Preview pane */}
                    <AnimatePresence initial={false}>
                        {(viewMode === "split" || viewMode === "preview") && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex-1 min-w-0"
                            >
                                <PreviewPane
                                    url={previewUrl}
                                    device={device}
                                    deviceWidth={DEVICE_WIDTHS[device]}
                                    isGenerating={isGenerating}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}