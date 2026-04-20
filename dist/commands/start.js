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
exports.start = start;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const web_1 = require("./web");
async function start() {
    (0, web_1.prepareWebUi)();
    const logPath = path.resolve('.skiv/orchestrator.log');
    const logStream = (0, fs_1.createWriteStream)(logPath, { flags: 'a' });
    const cliPath = path.resolve(__dirname, '../cli.js');
    const orchestrator = (0, child_process_1.spawn)('node', [cliPath, 'run'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    orchestrator.stdout?.pipe(logStream);
    orchestrator.stderr?.pipe(logStream);
    orchestrator.on('close', (code) => {
        logStream.end();
        if (code !== 0 && code !== null) {
            console.error(`\n[skiv] orchestrator exited unexpectedly (code=${code}). Check ${logPath}`);
        }
    });
    const webPort = process.env.PORT ?? '3000';
    const webProc = (0, web_1.spawnWebUi)(webPort);
    webProc.on('close', (code) => {
        if (code !== 0 && code !== null) {
            console.error(`\n[skiv] web UI exited unexpectedly (code=${code})`);
        }
    });
    console.log(`[skiv] orchestrator started (log: ${logPath})`);
    console.log(`[skiv] web UI started at http://localhost:${webPort}`);
    const mcpConfigPath = path.resolve('.skiv/mcp.json');
    const claude = (0, child_process_1.spawn)('claude', ['--mcp-config', mcpConfigPath], {
        cwd: process.cwd(),
        stdio: 'inherit',
    });
    return new Promise((resolve, reject) => {
        claude.on('close', (code) => {
            orchestrator.kill();
            webProc.kill();
            if (code === 0 || code === null)
                resolve();
            else
                reject(new Error(`claude exited with code ${code}`));
        });
    });
}
