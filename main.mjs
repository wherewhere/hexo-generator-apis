#!/usr/bin/env node
"use strict";

import { StdioServerTransport } from "@modelcontextprotocol/server";
import { createMcp, fetchWithTimeout } from "./lib/mcp.mjs";
import _package from "./package.json" with { type: "json" };

if (process.argv.length < 3) {
    process.stderr.write("Usage: node main.mjs <openapi.json URL>\n");
    process.exit(1);
}

const openApiUrl = new URL(process.argv[2]);

async function main() {
    const response = await fetchWithTimeout(openApiUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch OpenAPI: ${response.status} ${response.statusText}`);
    }

    /** @type {Record<string, any>} */
    const openApi = await response.json();
    const baseFromOpenApi = new URL('.', openApiUrl).toString();

    const server = createMcp(openApi, {
        name: _package.name,
        url: baseFromOpenApi
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(error => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});