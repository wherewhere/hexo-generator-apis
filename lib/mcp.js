"use strict";

const { name, version } = require("../package.json");

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
 * @typedef {{name?: string, description?: string, required?: boolean, schema?: {type?: string}}} Parameter
 * @typedef {{operationId?: string, summary?: string, description?: string, parameters?: Parameter[]}} OpenApiGetOperation
 * @typedef {{get?: OpenApiGetOperation}} OpenApiPathItem
 * @typedef {{title?: string, version?: string}} OpenApiInfo
 * @typedef {{url?: string}} OpenApiServer
 * @typedef {{paths?: Record<string, OpenApiPathItem>, info?: OpenApiInfo, servers?: OpenApiServer[]}} OpenApiDocument
 */

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

    return {
        type: "object",
        properties,
        required,
        additionalProperties: false
    };
}

/**
 * @param {OpenApiDocument} openApi
 * @param {{name?: string, url?: string}} options
 */
module.exports = function createMcp(openApi, options = {}) {
    if (!openApi || typeof openApi !== "object" || !openApi.paths) {
        return;
    }

    const baseUrl = options.url || openApi.servers?.[0]?.url || '';

    const tools = Object.entries(openApi.paths).flatMap(([path, value]) => {
        const get = value?.get;
        if (!get) {
            return [];
        }

        const operationId = get.operationId || `get_${path}`;
        const toolName = normalizeToolName(operationId);

        return [{
            name: toolName,
            description: get.description || get.summary || `GET ${path}`,
            inputSchema: buildInputSchema(get.parameters),
            annotations: {
                title: get.summary || operationId,
                readOnlyHint: true
            },
            x_http: {
                method: "GET",
                path,
                baseUrl
            }
        }];
    });

    return {
        serverInfo: {
            name: options.name || name,
            title: openApi.info?.title || options.name || name,
            version: openApi.info?.version || version
        },
        tools
    };
};
