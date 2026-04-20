"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToTaskManager = connectToTaskManager;
exports.callTool = callTool;
exports.getNextTask = getNextTask;
exports.getTaskById = getTaskById;
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const fs_1 = require("fs");
const path = __importStar(require("path"));
async function connectToTaskManager() {
    const mcpJson = JSON.parse((0, fs_1.readFileSync)(path.resolve('.skiv/mcp.json'), 'utf-8'));
    const serverConfig = mcpJson.mcpServers.task_manager;
    const transport = new stdio_js_1.StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args,
        env: { ...process.env, ...serverConfig.env },
    });
    const client = new index_js_1.Client({ name: 'skiv-orchestrator', version: '0.1.0' });
    await client.connect(transport);
    return client;
}
async function callTool(client, name, args) {
    const result = await client.callTool({ name, arguments: args });
    const text = result.content[0]?.text ?? '[]';
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed))
        return parsed;
    if (parsed && typeof parsed === 'object') {
        const arrayValue = Object.values(parsed).find((v) => Array.isArray(v));
        if (arrayValue)
            return arrayValue;
    }
    return parsed;
}
async function getNextTask(client, pickFrom) {
    const tasks = await callTool(client, 'list_tasks', { status: pickFrom });
    return tasks.find((t) => !t.assignee) ?? null;
}
async function getTaskById(client, taskId) {
    try {
        const result = await client.callTool({ name: 'get_task', arguments: { id: taskId } });
        const text = result.content[0]?.text ?? '{}';
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object')
            return null;
        if (parsed.id)
            return parsed;
        for (const value of Object.values(parsed)) {
            if (value && typeof value === 'object' && value.id)
                return value;
        }
        return null;
    }
    catch {
        return null;
    }
}
