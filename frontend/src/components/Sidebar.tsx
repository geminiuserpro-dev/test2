import { useState } from "react";
import {
    FileCode, Folder, FolderOpen, Plus, Search, Settings,
    ChevronDown, ChevronRight, Zap, GitBranch, Package,
    Shield, BarChart2, Plug
} from "lucide-react";
import type { Project } from "../pages/WorkspacePage";

interface SidebarProps {
    project: Project;
}

type SidebarTab = "files" | "tools" | "settings";

const TOOL_GROUPS = [
    { id: "code", label: "Code", icon: FileCode, count: 15, color: "text-token-blue" },
    { id: "browser", label: "Browser", icon: Search, count: 10, color: "text-token-green" },
    { id: "imagegen", label: "Images", icon: Zap, count: 2, color: "text-token-orange" },
    { id: "websearch", label: "Web Search", icon: Search, count: 2, color: "text-token-purple" },
    { id: "security", label: "Security", icon: Shield, count: 4, color: "text-destructive" },
    { id: "analytics", label: "Analytics", icon: BarChart2, count: 1, color: "text-token-green" },
    { id: "connectors", label: "Connectors", icon: Plug, count: 5, color: "text-muted-foreground" },
];

const DEFAULT_FILES = [
    {
        name: "src", type: "folder", children: [
            { name: "App.tsx", type: "file" },
            { name: "main.tsx", type: "file" },
            { name: "index.css", type: "file" },
            {
                name: "components", type: "folder", children: [
                    { name: "ChatPanel.tsx", type: "file" },
                    { name: "PreviewPane.tsx", type: "file" },
                ]
            },
            {
                name: "hooks", type: "folder", children: [
                    { name: "useApi.ts", type: "file" },
                ]
            },
            {
                name: "lib", type: "folder", children: [
                    { name: "firebase.ts", type: "file" },
                ]
            },
        ]
    },
    { name: "package.json", type: "file" },
    { name: "tailwind.config.ts", type: "file" },
    { name: "vite.config.ts", type: "file" },
];

function FileTree({ items, depth = 0 }: { items: any[]; depth?: number }) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({ src: true });

    return (
        <div>
            {items.map(item => (
                <div key={item.name}>
                    <button
                        onClick={() => item.type === "folder" && setExpanded(p => ({ ...p, [item.name]: !p[item.name] }))}
                        className="flex items-center gap-1.5 w-full px-2 py-[3px] rounded text-left hover:bg-accent group"
                        style={{ paddingLeft: `${8 + depth * 12}px` }}
                    >
                        {item.type === "folder"
                            ? expanded[item.name]
                                ? <><FolderOpen className="w-3.5 h-3.5 text-token-orange flex-shrink-0" /></>
                                : <><Folder className="w-3.5 h-3.5 text-token-orange flex-shrink-0" /></>
                            : <FileCode className="w-3.5 h-3.5 text-token-blue flex-shrink-0" />
                        }
                        <span className="text-[12px] text-sidebar-foreground group-hover:text-foreground truncate">
                            {item.name}
                        </span>
                    </button>
                    {item.type === "folder" && expanded[item.name] && item.children && (
                        <FileTree items={item.children} depth={depth + 1} />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function Sidebar({ project }: SidebarProps) {
    const [activeTab, setActiveTab] = useState<SidebarTab>("files");
    const [expandedGroup, setExpandedGroup] = useState<string | null>("code");

    return (
        <div className="flex flex-col h-full w-full bg-sidebar overflow-hidden">
            {/* Logo area */}
            <div className="flex items-center gap-2 px-3 h-11 border-b border-sidebar-border flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/20">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground truncate">{project.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono">v5</span>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-sidebar-border flex-shrink-0">
                {(["files", "tools", "settings"] as SidebarTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1.5 text-[11px] capitalize transition-colors ${activeTab === tab
                                ? "text-foreground border-b border-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 py-1">
                {activeTab === "files" && (
                    <>
                        <div className="flex items-center justify-between px-2 py-1.5">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Explorer</span>
                            <button className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <FileTree items={DEFAULT_FILES} />
                    </>
                )}

                {activeTab === "tools" && (
                    <div className="px-1">
                        <div className="px-1 py-1.5">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Tool Groups</span>
                        </div>
                        {TOOL_GROUPS.map(group => (
                            <div key={group.id}>
                                <button
                                    onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-accent group"
                                >
                                    {expandedGroup === group.id
                                        ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                        : <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                    }
                                    <group.icon className={`w-3.5 h-3.5 ${group.color}`} />
                                    <span className="text-[12px] text-sidebar-foreground flex-1 text-left">{group.label}</span>
                                    <span className="text-[10px] text-muted-foreground/60 bg-muted rounded px-1">{group.count}</span>
                                </button>
                                {expandedGroup === group.id && (
                                    <div className="ml-6 border-l border-sidebar-border pl-2 mb-1">
                                        <p className="text-[11px] text-muted-foreground/60 py-1 px-1">
                                            {group.count} tools available
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="px-3 py-2 space-y-3">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">Project</p>
                            <div className="space-y-1">
                                {["Rename project", "Transfer", "Delete"].map(item => (
                                    <button key={item} className="block w-full text-left text-[12px] text-sidebar-foreground hover:text-foreground py-1 px-2 rounded hover:bg-accent">
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">Integrations</p>
                            <div className="space-y-1">
                                {["buildfast Cloud", "GitHub", "Stripe", "Shopify"].map(item => (
                                    <button key={item} className="flex items-center justify-between w-full text-left text-[12px] text-sidebar-foreground hover:text-foreground py-1 px-2 rounded hover:bg-accent">
                                        <span>{item}</span>
                                        <span className="text-[10px] text-muted-foreground/60">Connect</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom: git branch */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-t border-sidebar-border flex-shrink-0">
                <GitBranch className="w-3 h-3 text-muted-foreground/60" />
                <span className="text-[11px] text-muted-foreground/60 font-mono">main</span>
                <span className="ml-auto text-[11px] text-muted-foreground/40">0 changes</span>
            </div>
        </div>
    );
}