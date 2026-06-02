#!/usr/bin/env node
"use strict";

const { URL } = require("url");
const { name, version } = require("./package.json");
const createMcp = require("./lib/mcp");

const openApiUrl = process.argv[2];
const timeoutMs = Number.parseInt(process.env.MCP_FETCH_TIMEOUT_MS || "15000", 10);

if (!openApiUrl) {
    process.stderr.write("Usage: node main.js <openapi.json URL>\n");
    process.exit(1);
}

function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function asObject(value) {
    return isRecord(value) ? value : {};
}

function toText(value) {
    if (typeof value === "string") {
        return value;
    }

    try {
        return JSON.stringify(value, null, 2);
    }
    catch {
        return String(value);
    }
}

/**
 * @param {string} url
 * @param {RequestInit & { timeout?: number }} [init]
 */
async function fetchWithTimeout(url, init = {}) {
    const controller = new AbortController();
    const timeout = Number.isFinite(init.timeout) ? Number(init.timeout) : timeoutMs;
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const requestInit = { ...init, signal: controller.signal };
        delete requestInit.timeout;
        return await fetch(url, requestInit);
    }
    finally {
        clearTimeout(timer);
    }
}

function isTimeoutError(error) {
    return !!error && typeof error === "object" && "name" in error && error.name === "AbortError";
}

/**
 * @param {{x_http?: {baseUrl?: string, path?: string}}} tool
 * @param {Record<string, any>} args
 * @param {string} fallbackBaseUrl
 */
function buildToolUrl(tool, args, fallbackBaseUrl) {
    const http = asObject(tool.x_http);
    const rawPath = typeof http.path === "string" ? http.path : '';
    const rawBaseUrl = typeof http.baseUrl === "string" && http.baseUrl ? http.baseUrl : fallbackBaseUrl;

    const usedKeys = new Set();
    const path = rawPath.replace(/\{([^}]+)\}/g, (_, key) => {
        usedKeys.add(key);
        const value = args[key];
        if (typeof value === "undefined") {
            throw new Error(`Missing required path parameter: ${key}`);
        }
        return encodeURIComponent(String(value));
    });

    const url = new URL(path, rawBaseUrl);

    for (const key in args) {
        const value = args[key];
        
        if (usedKeys.has(key) || typeof value === "undefined" || value === null) {
            continue;
        }

        if (Array.isArray(value)) {
            value.forEach(item => url.searchParams.append(key, String(item)));
            continue;
        }

        if (isRecord(value)) {
            url.searchParams.set(key, JSON.stringify(value));
            continue;
        }

        url.searchParams.set(key, String(value));
    }

    return url;
}

/**
 * @param {Record<string, any>} message
 */
function encodeRawMessage(message) {
    return `${JSON.stringify(message)}\n`;
}

/**
 * @param {Record<string, any>} message
 */
function sendMessage(message) {
    process.stdout.write(encodeRawMessage(message));
}

/**
 * @param {string} method
 */
function sendNotification(method, params) {
    sendMessage({
        jsonrpc: "2.0",
        method,
        params
    });
}

/**
 * @param {string | number | null} id
 */
function sendResult(id, result) {
    if (id === null || typeof id === "undefined") {
        return;
    }

    sendMessage({ jsonrpc: "2.0", id, result });
}

/**
 * @param {string | number | null} id
 * @param {number} code
 * @param {string} message
 */
function sendError(id, code, message, data) {
    if (id === null || typeof id === "undefined") {
        return;
    }

    sendMessage({
        jsonrpc: "2.0",
        id,
        error: {
            code,
            message,
            data
        }
    });
}

/**
 * Write operational info logs as MCP notifications.
 * @param {string} message
 */
function logInfo(message) {
    sendNotification("notifications/message", {
        level: "info",
        data: message
    });
}

/**
 * Extract one complete JSON object from the beginning of a text buffer.
 * @param {string} input
 * @returns {{jsonText: string, rest: string} | null}
 */
function extractLeadingJsonObject(input) {
    const start = input.search(/\S/);
    if (start === -1 || input[start] !== '{') {
        return null;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < input.length; i++) {
        const ch = input[i];

        if (inString) {
            if (escaped) {
                escaped = false;
                continue;
            }

            if (ch === '\\') {
                escaped = true;
                continue;
            }

            if (ch === '"') {
                inString = false;
            }
            continue;
        }

        if (ch === '"') {
            inString = true;
            continue;
        }

        if (ch === '{') {
            depth += 1;
            continue;
        }

        if (ch === '}') {
            depth -= 1;
            if (depth === 0) {
                return {
                    jsonText: input.slice(start, i + 1),
                    rest: input.slice(i + 1)
                };
            }
        }
    }

    return null;
}

/** @typedef {Promise<{mcp: ReturnType<typeof import("./lib/mcp")>, toolMap: Map<string, object>, baseFromOpenApi: string}>} McpStatePromise */

/** @type {McpStatePromise | null} */
let mcpStatePromise = null;

/**
 * @returns {McpStatePromise}
 */
function ensureMcpState() {
    if (mcpStatePromise) {
        return mcpStatePromise;
    }

    mcpStatePromise = (async () => {
        const response = await fetchWithTimeout(openApiUrl);
        logInfo(`Fetch completed; url=${openApiUrl} status=${response.status}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch OpenAPI: ${response.status} ${response.statusText}`);
        }

        /** @type {Record<string, any>} */
        const openApi = await response.json();
        logInfo(`Read JSON completed; source=openapi url=${openApiUrl}`);

        const baseFromOpenApi = (() => {
            try {
                return new URL('.', openApiUrl).toString();
            }
            catch {
                return "http://localhost/";
            }
        })();

        const mcp = createMcp(openApi, {
            name: "hexo-generator-apis",
            url: baseFromOpenApi
        });

        if (!mcp || !Array.isArray(mcp.tools)) {
            throw new Error("Unable to build MCP tools from OpenAPI");
        }

        /** @type {Map<string, object>} */
        const toolMap = new Map();
        mcp.tools.forEach(tool => {
            if (tool && typeof tool.name === "string") {
                toolMap.set(tool.name, tool);
            }
        });

        logInfo(`MCP server ready; loaded ${mcp.tools.length} tools from OpenAPI`);

        return {
            mcp,
            toolMap,
            baseFromOpenApi
        };
    })().catch(error => {
        // Allow retry after a failed lazy load.
        mcpStatePromise = null;
        throw error;
    });

    return mcpStatePromise;
}

function startServer() {
    let textBuffer = '';
    let hasSeenInput = false;

    setTimeout(() => {
        if (!hasSeenInput) {
            logInfo("No stdin data received within 5s after startup");
        }
    }, 5000);

    logInfo("MCP transport ready; waiting for requests");
    process.stdin.on("data", async chunk => {
        const input = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
        textBuffer += input;

        if (!hasSeenInput) {
            hasSeenInput = true;
        }

        while (true) {
            const extracted = extractLeadingJsonObject(textBuffer);
            if (!extracted) {
                break;
            }

            textBuffer = extracted.rest;

            let request;
            try {
                request = JSON.parse(extracted.jsonText);
            }
            catch (error) {
                sendError(null, -32700, "Parse error", toText(error));
                continue;
            }

            const id = request?.id ?? null;
            const method = request?.method;

            try {
                if (method === "initialize") {
                    // Keep initialize fast; do not block on OpenAPI network fetch.
                    sendResult(id, {
                        capabilities: {
                            tools: {
                                listChanged: false
                            }
                        },
                        serverInfo: { name, version }
                    });
                    continue;
                }

                if (method === "notifications/initialized") {
                    ensureMcpState().catch(error => {
                        process.stderr.write(`Failed to preload OpenAPI: ${toText(error)}\n`);
                    });
                    continue;
                }

                if (method === "tools/list") {
                    const { mcp } = await ensureMcpState();
                    sendResult(id, {
                        tools: mcp.tools.map(tool => ({
                            name: tool.name,
                            description: tool.description,
                            inputSchema: tool.inputSchema,
                            annotations: tool.annotations
                        }))
                    });
                    continue;
                }

                if (method === "tools/call") {
                    const { toolMap, baseFromOpenApi } = await ensureMcpState();
                    const params = asObject(request.params);
                    const toolName = typeof params.name === "string" ? params.name : '';
                    const tool = toolMap.get(toolName);
                    if (!tool) {
                        sendError(id, -32602, `Tool not found: ${toolName}`, null);
                        continue;
                    }

                    const args = asObject(params.arguments);
                    const url = buildToolUrl(tool, args, baseFromOpenApi);
                    const res = await fetchWithTimeout(url, { method: "GET" });
                    logInfo(`Fetch completed; tool=${toolName} url=${url.toString()} status=${res.status}`);

                    if (!res.ok) {
                        sendError(id, -32000, `HTTP ${res.status} ${res.statusText}`, {
                            url: url.toString()
                        });
                        continue;
                    }

                    const contentType = (res.headers.get("content-type") || '').toLowerCase();
                    let data;
                    if (contentType.includes("application/json")) {
                        data = await res.json();
                        logInfo(`Read JSON completed; tool=${toolName} url=${url.toString()}`);
                    }
                    else {
                        data = await res.text();
                    }

                    sendResult(id, {
                        content: [{
                            type: "text",
                            text: toText(data)
                        }],
                        structuredContent: isRecord(data) || Array.isArray(data) ? data : undefined,
                        isError: false
                    });
                    continue;
                }

                sendError(id, -32601, `Method not found: ${String(method)}`, null);
            }
            catch (error) {
                if (isTimeoutError(error)) {
                    sendError(id, -32001, `Request timeout after ${timeoutMs}ms`, null);
                    logInfo(`Request timeout (raw mode); method=${String(method)} timeoutMs=${timeoutMs}`);
                    continue;
                }

                sendError(id, -32000, "Internal error", toText(error));
            }
        }
    });

    process.stdin.resume();
}

startServer();
