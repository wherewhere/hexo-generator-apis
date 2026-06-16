"use strict";

import { readFile } from "fs/promises";
import { fromJsonSchema, McpServer } from "@modelcontextprotocol/server";
import _package from "../package.json" with { type: "json" };

/**
 * @typedef {{name?: string, description?: string, required?: boolean, schema?: {type?: string}}} Parameter
 * @typedef {{operationId?: string, summary?: string, description?: string, parameters?: Parameter[]}} OpenApiGetOperation
 * @typedef {{get?: OpenApiGetOperation}} OpenApiPathItem
 * @typedef {{title?: string, version?: string}} OpenApiInfo
 * @typedef {{url?: string}} OpenApiServer
 * @typedef {{paths?: Record<string, OpenApiPathItem>, info?: OpenApiInfo, servers?: OpenApiServer[]}} OpenApiDocument
 */

/**
 * @param {string} name
 */
function normalizeToolName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '') || "get_resource";
}

/**
 * @param {Parameter[]} parameters
 */
function buildInputSchema(parameters = []) {
    /** @type {{[key in keyof Parameter]: {type?: string}}} */
    const properties = {};
    /** @type {string[]} */
    const required = [];

    for (const param of parameters) {
        if (!param || typeof param.name !== "string") {
            continue;
        }

        const schema = param.schema && typeof param.schema === "object"
            ? { ...param.schema }
            : { type: "string" };

        if (param.description) {
            schema.description = param.description;
        }

        properties[param.name] = schema;

        if (param.required) {
            required.push(param.name);
        }
    }

    return fromJsonSchema({
        type: "object",
        properties,
        required,
        additionalProperties: false
    });
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

const timeoutMs = Number.parseInt(process.env.MCP_FETCH_TIMEOUT_MS || "15000", 10);

/**
 * @param {URL} url
 * @param {RequestInit & { timeout?: number }} init
 */
export async function fetchWithTimeout(url, init = {}) {
    const controller = new AbortController();
    const timeout = Number.isFinite(init.timeout) ? Number(init.timeout) : timeoutMs;
    const timer = setTimeout(controller.abort, timeout);
    try {
        switch (url.protocol) {
            case "file:":
                const pathname = url.pathname.slice(1);
                try {
                    const content = await readFile(pathname, "utf-8", { signal: controller.signal });
                    return {
                        ok: true,
                        status: 200,
                        statusText: "OK",
                        json: () => JSON.parse(content),
                        text: () => content,
                        headers: {
                            get: () => "application/json"
                        }
                    };
                }
                catch (error) {
                    return {
                        ok: false,
                        status: 500,
                        statusText: String(error),
                        json: () => { throw error; },
                        text: () => { throw error; },
                        headers: {
                            get: () => null
                        }
                    };
                }
                break;
            default:
                const requestInit = { ...init, signal: controller.signal };
                delete requestInit.timeout;
                return await fetch(url, requestInit);
        }
    }
    finally {
        clearTimeout(timer);
    }
}

/**
 * @param {{baseUrl?: string, path?: string}} http
 * @param {Record<string, any>} args
 * @param {string} fallbackBaseUrl
 */
function buildToolUrl(http, args, fallbackBaseUrl) {
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
        else if (typeof value === "object") {
            url.searchParams.set(key, JSON.stringify(value));
            continue;
        }

        url.searchParams.set(key, String(value));
    }

    return url;
}

/**
 * @param {OpenApiDocument} openApi
 * @param {{name?: string, url?: string}} options
 */
export function createMcp(openApi, options = {}) {
    const baseUrl = options.url || openApi.servers?.[0]?.url || '';
    const server = new McpServer({
        version: openApi.info?.version || _package.version,
        name: options.name || _package.name,
        websiteUrl: baseUrl,
        description: openApi.info?.description || `Tools generated from OpenAPI spec at ${baseUrl}`,
        title: openApi.info?.title || options.name || _package.name
    });
    for (const path in openApi.paths) {
        const value = openApi.paths[path];
        const get = value?.get;
        if (!get) {
            continue;
        }

        const operationId = get.operationId || `get_${path}`;
        const toolName = normalizeToolName(operationId);

        server.registerTool(
            toolName,
            {
                description: get.description || get.summary || `GET ${path}`,
                inputSchema: buildInputSchema(get.parameters),
                annotations: {
                    title: get.summary || operationId,
                    readOnlyHint: true
                }
            },
            async (args) => {
                try {
                    const url = buildToolUrl({ path, baseUrl }, args || {}, baseUrl);
                    const res = await fetchWithTimeout(url, { method: "GET" });

                    if (!res.ok) {
                        return {
                            isError: true,
                            content: [{
                                type: "text",
                                text: `HTTP ${res.status} ${res.statusText}\n${url.toString()}`
                            }]
                        };
                    }

                    const contentType = (res.headers.get("content-type") || '').toLowerCase();
                    const data = contentType.includes("application/json")
                        ? await res.json()
                        : await res.text();

                    return {
                        content: [{
                            type: "text",
                            text: toText(data)
                        }],
                        structuredContent: typeof data === "string" ? undefined : data
                    };
                }
                catch (error) {
                    const reason = error?.name === "AbortError"
                        ? `Request timeout after ${timeoutMs}ms`
                        : toText(error);
                    return {
                        isError: true,
                        content: [{
                            type: "text",
                            text: reason
                        }]
                    };
                }
            }
        );
    }
    return server;
}