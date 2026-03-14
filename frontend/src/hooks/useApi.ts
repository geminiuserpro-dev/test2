// src/hooks/useApi.ts  — exact tool signatures from Agent Tools.json

const BASE = "/api";

type OnChunk = (chunk: string, full: string) => void;

async function streamPost(path: string, body: unknown, onChunk?: OnChunk): Promise<string> {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let full = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        full += chunk;
        onChunk?.(chunk, full);
    }
    return full;
}

async function post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
}

async function get<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
}

// ── GENERATION ────────────────────────────────────────────────────────────────
export const generateApp = (opts: {
    prompt: string; projectId?: string;
    existingFiles?: Record<string, string>; onChunk?: OnChunk;
}) => streamPost("/generate", {
    prompt: opts.prompt, project_id: opts.projectId,
    existing_files: opts.existingFiles ?? null,
}, opts.onChunk);

export const sendChat = (opts: {
    messages: { role: string; content: string }[];
    projectId?: string; existingFiles?: Record<string, string>; onChunk?: OnChunk;
}) => streamPost("/chat", {
    messages: opts.messages, project_id: opts.projectId,
    existing_files: opts.existingFiles ?? null,
}, opts.onChunk);

// ── code--write ───────────────────────────────────────────────────────────────
/** PRIMARY write tool — for new files or complete rewrites. Prefer code--line_replace for edits. */
export const codeWrite = (filePath: string, content: string) =>
    post("/code/write", { file_path: filePath, content });

// ── code--line_replace ────────────────────────────────────────────────────────
/** PRIMARY edit tool. Search and replace by line range. Use '...' for >6 line sections. */
export const codeLineReplace = (opts: {
    filePath: string; search: string;
    firstReplacedLine: number; lastReplacedLine: number; replace: string;
}) => post("/code/line-replace", {
    file_path: opts.filePath, search: opts.search,
    first_replaced_line: opts.firstReplacedLine, last_replaced_line: opts.lastReplacedLine,
    replace: opts.replace,
});

// ── code--view ────────────────────────────────────────────────────────────────
/** Read file contents. Default: first 500 lines. Read multiple in parallel. */
export const codeView = (filePath: string, lines?: string) =>
    post<{ content: string }>("/code/view", { file_path: filePath, lines });

// ── code--list_dir ────────────────────────────────────────────────────────────
export const codeListDir = (dirPath: string) =>
    post<{ entries: string[] }>("/code/list-dir", { dir_path: dirPath });

// ── code--search_files ────────────────────────────────────────────────────────
export const codeSearchFiles = (opts: {
    query: string; searchDir?: string; includePatterns?: string;
    excludePatterns?: string; excludeDirs?: string; caseSensitive?: boolean;
}) => post("/code/search-files", {
    query: opts.query, search_dir: opts.searchDir,
    include_patterns: opts.includePatterns, exclude_patterns: opts.excludePatterns,
    exclude_dirs: opts.excludeDirs, case_sensitive: opts.caseSensitive ?? false,
});

// ── code--delete ──────────────────────────────────────────────────────────────
export const codeDelete = (filePath: string) =>
    post("/code/delete", { file_path: filePath });

// ── code--rename ──────────────────────────────────────────────────────────────
export const codeRename = (original: string, newPath: string) =>
    post("/code/rename", { original_file_path: original, new_file_path: newPath });

// ── code--copy ────────────────────────────────────────────────────────────────
/** Useful for user-uploads:// → project. */
export const codeCopy = (src: string, dest: string, overwrite = false) =>
    post("/code/copy", { source_file_path: src, destination_file_path: dest, overwrite });

// ── code--download_to_repo ────────────────────────────────────────────────────
/** src/assets/ for React imports. public/ for CSS/HTML refs. DO NOT use for user-uploads://. */
export const codeDownloadToRepo = (sourceUrl: string, targetPath: string) =>
    post("/code/download-to-repo", { source_url: sourceUrl, target_path: targetPath });

// ── code--fetch_website ───────────────────────────────────────────────────────
export const codeFetchWebsite = (url: string, formats = "markdown") =>
    post<{ markdown_preview: string; html_preview: string }>("/code/fetch-website", { url, formats });

// ── code--read_console_logs ───────────────────────────────────────────────────
/** Snapshot — call only ONCE. Does not update while coding. */
export const codeReadConsoleLogs = (search = "") =>
    post<{ logs: unknown[] }>("/code/read-console-logs", { search });

// ── code--read_network_requests ───────────────────────────────────────────────
export const codeReadNetworkRequests = (search = "") =>
    post<{ requests: unknown[] }>("/code/read-network-requests", { search });

// ── code--read_session_replay ─────────────────────────────────────────────────
/** PRIMARY debugging tool for UI/behavior issues — rrweb session replay. */
export const codeReadSessionReplay = () =>
    post("/code/read-session-replay");

// ── code--add_dependency ──────────────────────────────────────────────────────
export const codeAddDependency = (pkg: string) =>
    post("/code/add-dependency", { package: pkg });

// ── code--remove_dependency ───────────────────────────────────────────────────
export const codeRemoveDependency = (pkg: string) =>
    post("/code/remove-dependency", { package: pkg });

// ── code--run_tests ───────────────────────────────────────────────────────────
export const codeRunTests = (path?: string, timeout?: number) =>
    post("/code/run-tests", { path, timeout });

// ── code--dependency_scan ─────────────────────────────────────────────────────
export const codeDependencyScan = () =>
    post<{ vulnerabilities: unknown[]; high: number; critical: number }>("/code/dependency-scan");

// ── code--dependency_update ───────────────────────────────────────────────────
/** Use exact versions from security findings, not 'latest'. */
export const codeDependencyUpdate = (vulnerablePackages: Record<string, string>) =>
    post("/code/dependency-update", { vulnerable_packages: vulnerablePackages });

// ── browser--* ────────────────────────────────────────────────────────────────
/** DO NOT use on initial generation. Only for verifying complex codebases. */
export const browserNavigate = (path = "/", width?: number, height?: number) =>
    post("/browser/navigate", { path, width, height });

export const browserAct = (opts: { mode: "natural_language" | "structured"; action?: string; method?: string; selector?: string }) =>
    post("/browser/act", opts);

export const browserObserve = (instruction?: string) =>
    post<{ actions: unknown[] }>("/browser/observe", { instruction });

export const browserScreenshot = () =>
    post<{ screenshot: string | null }>("/browser/screenshot");

export const browserGetUrl = () =>
    get<{ url: string }>("/browser/url");

export const browserExtract = (instruction: string, schema?: Record<string, unknown>) =>
    post("/browser/extract", { instruction, schema });

export const browserSetViewport = (width: number, height: number) =>
    post("/browser/set-viewport", { width, height });

// ── imagegen--generate_image ──────────────────────────────────────────────────
/**
 * Models: flux.schnell (default, <1000px) | flux2.dev (1024x1024/1920x1080) | flux.dev (other large)
 * transparent_background=true for logos/icons. Dims: 512–1920px ×32.
 * Import as ES6 — do NOT call assets--create_asset after.
 */
export const imagegenGenerate = (opts: {
    prompt: string; targetPath: string; transparentBackground?: boolean;
    width?: number; height?: number; model?: "flux.schnell" | "flux.dev" | "flux2.dev";
}) => post<{ image_b64: string; import_statement: string }>("/imagegen/generate", {
    prompt: opts.prompt, target_path: opts.targetPath,
    transparent_background: opts.transparentBackground ?? false,
    width: opts.width ?? 1024, height: opts.height ?? 1024,
    model: opts.model ?? "flux.schnell",
});

// ── imagegen--edit_image ──────────────────────────────────────────────────────
/** Single: apply edits. Multiple: blend/combine. Inputs: paths OR URLs. */
export const imagegenEdit = (opts: {
    imagePaths: string[]; prompt: string; targetPath: string; aspectRatio?: string;
}) => post<{ image_b64: string; mime_type: string }>("/imagegen/edit", {
    image_paths: opts.imagePaths, prompt: opts.prompt, target_path: opts.targetPath,
    aspect_ratio: opts.aspectRatio,
});

// ── videogen--generate_video ──────────────────────────────────────────────────
export const videogenGenerate = (opts: {
    prompt: string; targetPath: string; startingFrame?: string;
    aspectRatio?: string; resolution?: "480p" | "1080p"; duration?: 5 | 10; cameraFixed?: boolean;
}) => post("/videogen/generate", {
    prompt: opts.prompt, target_path: opts.targetPath, starting_frame: opts.startingFrame,
    aspect_ratio: opts.aspectRatio ?? "16:9", resolution: opts.resolution ?? "1080p",
    duration: opts.duration ?? 5, camera_fixed: opts.cameraFixed ?? false,
});

// ── websearch--web_search ─────────────────────────────────────────────────────
/** For technical/code queries, prefer websearch--web_code_search. */
export const websearchSearch = (opts: {
    query: string; numResults?: number; links?: number; imageLinks?: number;
    category?: "news" | "linkedin profile" | "pdf" | "github" | "personal site" | "financial report";
}) => post<{ result: string; sources: { title: string; url: string }[] }>("/websearch/search", {
    query: opts.query, num_results: opts.numResults ?? 5,
    links: opts.links, image_links: opts.imageLinks, category: opts.category,
});

// ── websearch--web_code_search ────────────────────────────────────────────────
/** GitHub, docs, StackOverflow. NOT the current repo. */
export const websearchCode = (query: string, tokensNum = "dynamic") =>
    post<{ result: string; sources: { title: string; url: string }[] }>("/websearch/code-search", {
        query, tokens_num: tokensNum,
    });

// ── questions--ask_questions ──────────────────────────────────────────────────
export const questionsAsk = (questions: Array<{
    question: string; header: string;
    options: Array<{ label: string; description: string }>;
    multiSelect?: boolean; allowOther?: boolean;
}>) => post("/questions/ask", { questions });

// ── task_tracking--* ──────────────────────────────────────────────────────────
export const taskCreate = (title: string, description: string) =>
    post<{ task_id: string }>("/tasks/create", { title, description });

export const taskSetStatus = (taskId: string, status: "todo" | "in_progress" | "done") =>
    post("/tasks/status", { task_id: taskId, status });

export const taskGetList = () =>
    get<{ tasks: unknown[] }>("/tasks");

export const taskGet = (taskId: string) =>
    get(`/tasks/${taskId}`);

export const taskUpdateTitle = (taskId: string, newTitle: string) =>
    post("/tasks/update-title", { task_id: taskId, new_title: newTitle });

export const taskUpdateDescription = (taskId: string, newDescription: string) =>
    post("/tasks/update-description", { task_id: taskId, new_description: newDescription });

export const taskAddNote = (taskId: string, note: string) =>
    post("/tasks/add-note", { task_id: taskId, note });

// ── standard_connectors--* ────────────────────────────────────────────────────
export const connectorsConnect = (connectorId: string) =>
    post("/connectors/connect", { connector_id: connectorId });

export const connectorsDisconnect = (connectionId: string) =>
    post("/connectors/disconnect", { connection_id: connectionId });

export const connectorsList = () =>
    get<{ connections: unknown[] }>("/connectors/list");

export const connectorsReconnect = (connectionId: string, reason?: string, requiredScopes: string[] = []) =>
    post("/connectors/reconnect", { connection_id: connectionId, reason, required_scopes: requiredScopes });

// ── cross_project--* ──────────────────────────────────────────────────────────
export const crossListProjects = (limit = 20, offset = 0) =>
    post("/cross-project/list", { limit, offset });

export const crossReadFile = (project: string, filePath: string, lines?: string) =>
    post<{ content: string }>("/cross-project/read-file", { project, file_path: filePath, lines });

export const crossCopyAsset = (project: string, sourcePath: string, targetPath: string) =>
    post("/cross-project/copy-asset", { project, source_path: sourcePath, target_path: targetPath });

// ── lsp--code_intelligence ────────────────────────────────────────────────────
export const lspIntelligence = (opts: {
    operation: "hover" | "definition" | "references";
    filePath: string; line: number; character: number; includeSource?: boolean;
}) => post("/lsp/intelligence", {
    operation: opts.operation, file_path: opts.filePath, line: opts.line,
    character: opts.character, include_source: opts.includeSource ?? false,
});

// ── project_debug--sleep ──────────────────────────────────────────────────────
/** Max 60s. Use for async operations: edge function deploys, logs, cache invalidation. */
export const projectDebugSleep = (seconds: number) =>
    post("/project-debug/sleep", { seconds });

// ── project_urls--get_urls ────────────────────────────────────────────────────
export const projectGetUrls = () =>
    get<{ preview_url: string; published_url: string | null }>("/project-urls");

// ── secrets--* ────────────────────────────────────────────────────────────────
/** NEVER ask users for secret values — ALWAYS call this tool. */
export const secretsAdd = (secretName: string) =>
    post("/secrets/add", { secret_name: secretName });

export const secretsUpdate = (secretName: string) =>
    post("/secrets/update", { secret_name: secretName });

export const secretsDelete = (secretNames: string[]) =>
    post("/secrets/delete", { secret_names: secretNames });

export const secretsFetch = () =>
    get<{ secrets: string[] }>("/secrets/list");

// ── security--* ───────────────────────────────────────────────────────────────
export const securityRunScan = () =>
    post<{ scan_id: string }>("/security/scan");

export const securityGetResults = (force: boolean) =>
    post<{ findings: unknown[] }>("/security/results", { force });

export const securityGetSchema = () =>
    post("/security/schema");

// ── stripe--enable_stripe ─────────────────────────────────────────────────────
/** No parameters. Prompts user for Stripe secret key. */
export const stripeEnable = () =>
    post<{ key_valid: boolean; generated_code: string; next_steps: string[] }>("/stripe/enable");

// ── shopify--enable ───────────────────────────────────────────────────────────
export const shopifyEnable = (storeType: "new" | "existing") =>
    post("/shopify/enable", { store_type: storeType });

// ── analytics--read_project_analytics ────────────────────────────────────────
export const analyticsRead = (startdate: string, enddate: string, granularity: "hourly" | "daily") =>
    get<{ data: unknown[] }>(`/analytics?startdate=${startdate}&enddate=${enddate}&granularity=${granularity}`);

// ── document--parse_document ──────────────────────────────────────────────────
export const documentParse = (filePath: string) =>
    post<{ content: string }>("/document/parse", { file_path: filePath });

// ── supabase--docs_search / docs_get (→ Firebase) ─────────────────────────────
export const docsSearch = (query: string, maxResults = 5) =>
    post<{ results: { title: string; slug: string; url: string; snippet: string }[] }>(
        "/docs/search", { query, max_results: maxResults }
    );

export const docsGet = (slug: string) =>
    post<{ content: string }>("/docs/get", { slug });

// ── sandbox (Daytona — our addition) ─────────────────────────────────────────
export const sandboxExecute = (code: string, language = "python") =>
    post<{ success: boolean; output: string }>("/sandbox/execute", { code, language });