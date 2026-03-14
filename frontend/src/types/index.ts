// src/types/index.ts — shared types across the app

// ── Chat ───────────────────────────────────────────────────────────────────────
export type MessageRole = "user" | "assistant";

export type ChatMessage = {
    id: string;
    role: MessageRole;
    content: string;
    streaming?: boolean;
    timestamp: Date;
};

// ── Project ────────────────────────────────────────────────────────────────────
export type Project = {
    id: string;
    uid: string;
    name: string;
    files: Record<string, string>;   // filename → full content
    createdAt: Date;
    updatedAt: Date;
};

// ── UI ─────────────────────────────────────────────────────────────────────────
export type ViewMode = "split" | "chat" | "preview";
export type DevicePreset = "desktop" | "tablet" | "mobile";

export const DEVICE_WIDTHS: Record<DevicePreset, number> = {
    desktop: 1280,
    tablet: 768,
    mobile: 390,
};

// ── Tools ──────────────────────────────────────────────────────────────────────

// task_tracking
export type TaskStatus = "todo" | "in_progress" | "done";
export type Task = {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    notes: { note: string; at: string }[];
    created_at: string;
};

// security
export type SecurityLevel = "info" | "warn" | "error";
export type SecurityFinding = {
    id?: string;
    internal_id?: string;
    category?: string;
    name: string;
    description: string;
    details?: string;
    level: SecurityLevel;
    remediation_difficulty?: string;
    ignore?: boolean;
    link?: string;
};

// standard_connectors
export type Connection = {
    id: string;
    connector_id: string;
    name: string;
    status: "connected" | "disconnected" | "error";
    scopes?: string[];
};

// cross_project
export type CrossProject = {
    id: string;
    name: string;
    url?: string;
};

// analytics
export type AnalyticsDataPoint = {
    date: string;
    pageviews: number;
    sessions: number;
    users: number;
    bounce_rate: number;
};

// questions
export type QuestionOption = {
    label: string;
    description: string;
};

export type Question = {
    question: string;
    header: string;
    options: QuestionOption[];
    multiSelect: boolean;
    allowOther?: boolean;
};

// imagegen
export type ImageModel = "flux.schnell" | "flux.dev" | "flux2.dev";
export type VideoAspectRatio = "16:9" | "4:3" | "1:1" | "3:4" | "9:16" | "21:9";
export type VideoResolution = "480p" | "1080p";

// secrets
export type Secret = {
    name: string;
    created_at: string;
};

// LSP
export type LSPOperation = "hover" | "definition" | "references";