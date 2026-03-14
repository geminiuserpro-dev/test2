import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, User, Copy, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Message } from "../pages/WorkspacePage";

interface ChatPanelProps {
    messages: Message[];
    isGenerating: boolean;
}

// Renders AI message content with code block, mermaid, final-text support
function MessageContent({ content, streaming }: { content: string; streaming?: boolean }) {
    const [copied, setCopied] = useState<string | null>(null);

    const copyCode = async (code: string, id: string) => {
        await navigator.clipboard.writeText(code);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    // Parse content into segments
    const segments: Array<{ type: "text" | "code" | "mermaid" | "final-text"; content: string; lang?: string }> = [];
    let remaining = content;

    // Handle <final-text> tags
    remaining = remaining.replace(/<final-text>([\s\S]*?)<\/final-text>/g, (_, inner) => {
        return `\x00final-text\x00${inner}\x00end\x00`;
    });

    // Handle <build-mermaid> tags
    remaining = remaining.replace(/<build-mermaid>([\s\S]*?)<\/build-mermaid>/g, (_, inner) => {
        return `\x00mermaid\x00${inner}\x00end\x00`;
    });

    // Split by code blocks and special markers
    const parts = remaining.split(/(```[\s\S]*?```|\x00(?:final-text|mermaid)\x00[\s\S]*?\x00end\x00)/);

    for (const part of parts) {
        if (!part) continue;
        if (part.startsWith("```")) {
            const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
            if (match) {
                segments.push({ type: "code", lang: match[1] || "text", content: match[2].trim() });
            } else {
                segments.push({ type: "text", content: part });
            }
        } else if (part.startsWith("\x00final-text\x00")) {
            const inner = part.replace(/\x00final-text\x00([\s\S]*?)\x00end\x00/, "$1");
            segments.push({ type: "final-text", content: inner.trim() });
        } else if (part.startsWith("\x00mermaid\x00")) {
            const inner = part.replace(/\x00mermaid\x00([\s\S]*?)\x00end\x00/, "$1");
            segments.push({ type: "mermaid", content: inner.trim() });
        } else {
            segments.push({ type: "text", content: part });
        }
    }

    return (
        <div className="space-y-2">
            {segments.map((seg, i) => {
                if (seg.type === "code") {
                    const codeId = `code-${i}`;
                    return (
                        <div key={i} className="rounded-lg border border-border overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-code-bg border-b border-border">
                                <span className="text-[11px] text-muted-foreground font-mono">{seg.lang || "code"}</span>
                                <button
                                    onClick={() => copyCode(seg.content, codeId)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {copied === codeId
                                        ? <Check className="w-3.5 h-3.5 text-token-green" />
                                        : <Copy className="w-3.5 h-3.5" />
                                    }
                                </button>
                            </div>
                            <pre className="px-3 py-2.5 bg-code-bg overflow-x-auto font-code text-foreground/90 text-[12px] leading-relaxed">
                                <code>{seg.content}</code>
                            </pre>
                        </div>
                    );
                }

                if (seg.type === "mermaid") {
                    return (
                        <div key={i} className="rounded-lg border border-border bg-code-bg p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Diagram</span>
                            </div>
                            <pre className="font-code text-[11px] text-token-blue">{seg.content}</pre>
                        </div>
                    );
                }

                if (seg.type === "final-text") {
                    return (
                        <div key={i} className="text-sm text-foreground/90 leading-relaxed">
                            {seg.content}
                        </div>
                    );
                }

                // Regular text — render markdown-ish
                const text = seg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`([^`]+)`/g, '<code class="font-code text-token-orange bg-code-bg px-1 py-0.5 rounded text-[11.5px]">$1</code>')
                    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-3 mb-1">$1</h3>')
                    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-semibold mt-3 mb-1">$1</h2>')
                    .replace(/^- (.+)$/gm, '<li class="ml-3 text-[13px]">• $1</li>')
                    .replace(/\n/g, '<br/>');

                return (
                    <div key={i} className="text-[13.5px] text-foreground/85 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: text }} />
                );
            })}
            {streaming && (
                <span className="inline-block w-2 h-4 bg-primary rounded-sm animate-cursor-blink ml-0.5" />
            )}
        </div>
    );
}

// Typing indicator dots
function ThinkingDots() {
    return (
        <div className="flex items-center gap-1 py-1">
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot"
                    style={{ animationDelay: `${i * 0.2}s` }}
                />
            ))}
        </div>
    );
}

export default function ChatPanel({ messages, isGenerating }: ChatPanelProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };

    return (
        <div className="relative flex flex-col flex-1 min-h-0">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
            >
                <AnimatePresence initial={false}>
                    {messages.map(msg => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${msg.role === "user"
                                ? "bg-secondary border border-border"
                                : "bg-primary/15 border border-primary/25"
                                }`}>
                                {msg.role === "user"
                                    ? <User className="w-3.5 h-3.5 text-muted-foreground" />
                                    : <Sparkles className="w-3.5 h-3.5 text-primary" />
                                }
                            </div>

                            {/* Bubble */}
                            <div className={`flex-1 max-w-[85%] rounded-xl px-3.5 py-2.5 ${msg.role === "user"
                                ? "bg-chat-user text-foreground ml-auto"
                                : "bg-chat-ai text-foreground"
                                }`}>
                                {msg.role === "assistant"
                                    ? <MessageContent content={msg.content} streaming={msg.streaming} />
                                    : <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                }
                                {msg.role === "assistant" && msg.streaming && !msg.content && (
                                    <ThinkingDots />
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isGenerating && messages[messages.length - 1]?.role !== "assistant" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                    >
                        <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="bg-chat-ai rounded-xl px-3.5 py-2.5">
                            <ThinkingDots />
                        </div>
                    </motion.div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
                {showScrollBtn && (
                    <motion.button
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                        className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-card border border-border shadow flex items-center justify-center hover:bg-accent transition-colors"
                    >
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
} 