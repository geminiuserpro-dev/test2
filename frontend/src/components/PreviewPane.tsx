import { motion } from "framer-motion";
import {
    MessageSquare, Eye, Columns2, Monitor, Tablet, Smartphone,
    PanelLeftOpen, PanelLeftClose, Zap, Share2, Play,
    GitBranch, ChevronDown
} from "lucide-react";
import type { Project } from "../pages/WorkspacePage";

type ViewMode = "split" | "chat" | "preview";
type DevicePreset = "desktop" | "tablet" | "mobile";

interface ToolBarProps {
    project: Project;
    viewMode: ViewMode;
    setViewMode: (v: ViewMode) => void;
    device: DevicePreset;
    setDevice: (d: DevicePreset) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
    previewUrl: string;
    isGenerating: boolean;
}

const VIEW_OPTIONS = [
    { id: "chat" as ViewMode, icon: MessageSquare, label: "Chat" },
    { id: "split" as ViewMode, icon: Columns2, label: "Split" },
    { id: "preview" as ViewMode, icon: Eye, label: "Preview" },
];

const DEVICE_OPTIONS = [
    { id: "desktop" as DevicePreset, icon: Monitor },
    { id: "tablet" as DevicePreset, icon: Tablet },
    { id: "mobile" as DevicePreset, icon: Smartphone },
];

export default function ToolBar({
    project, viewMode, setViewMode, device, setDevice,
    sidebarOpen, setSidebarOpen, previewUrl, isGenerating,
}: ToolBarProps) {
    return (
        <div className="flex items-center gap-2 px-3 h-11 border-b border-border bg-background flex-shrink-0">
            {/* Sidebar toggle */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
                {sidebarOpen
                    ? <PanelLeftClose className="w-4 h-4" />
                    : <PanelLeftOpen className="w-4 h-4" />
                }
            </button>

            <div className="w-px h-4 bg-border" />

            {/* Project name */}
            <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-accent text-foreground transition-colors">
                <span className="text-sm font-medium">{project.name}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {/* Generating indicator */}
            {isGenerating && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 border border-primary/20">
                    <div className="flex gap-0.5">
                        {[0, 1, 2].map(i => (
                            <span
                                key={i}
                                className="w-1 h-1 rounded-full bg-primary animate-pulse-dot"
                                style={{ animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                    <span className="text-[11px] text-primary">Building…</span>
                </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* View mode switcher */}
            <div className="flex items-center bg-card border border-border rounded-lg p-0.5">
                {VIEW_OPTIONS.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setViewMode(opt.id)}
                        className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] transition-colors ${viewMode === opt.id
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                        title={opt.label}
                    >
                        {viewMode === opt.id && (
                            <motion.div
                                layoutId="active-view"
                                className="absolute inset-0 bg-accent rounded-md"
                                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            />
                        )}
                        <opt.icon className="relative w-3.5 h-3.5" />
                        <span className="relative hidden sm:inline">{opt.label}</span>
                    </button>
                ))}
            </div>

            {/* Device switcher */}
            <div className="flex items-center bg-card border border-border rounded-lg p-0.5">
                {DEVICE_OPTIONS.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setDevice(opt.id)}
                        className={`relative p-1.5 rounded-md transition-colors ${device === opt.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                        title={opt.id}
                    >
                        {device === opt.id && (
                            <motion.div
                                layoutId="active-device"
                                className="absolute inset-0 bg-accent rounded-md"
                                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            />
                        )}
                        <opt.icon className="relative w-3.5 h-3.5" />
                    </button>
                ))}
            </div>

            <div className="w-px h-4 bg-border" />

            {/* Publish button */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12.5px] font-medium hover:opacity-90 transition-opacity">
                <Zap className="w-3.5 h-3.5" />
                Publish
            </button>
        </div>
    );
}