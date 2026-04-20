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
exports.prepareWebUi = prepareWebUi;
exports.spawnWebUi = spawnWebUi;
exports.web = web;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const WEB_UI_CACHE_DIR = path.join(os.homedir(), '.skiv', 'web-ui');
const RESOURCES_WEB_DIR = path.join(__dirname, '../../resources/web-ui');
const VERSION_FILE = path.join(WEB_UI_CACHE_DIR, '.skiv-version');
function getCurrentVersion() {
    try {
        const pkgPath = path.join(__dirname, '../../package.json');
        return JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version ?? '0';
    }
    catch {
        return '0';
    }
}
function isSetupNeeded() {
    if (!fs.existsSync(path.join(WEB_UI_CACHE_DIR, 'node_modules')))
        return true;
    if (!fs.existsSync(VERSION_FILE))
        return true;
    return fs.readFileSync(VERSION_FILE, 'utf-8').trim() !== getCurrentVersion();
}
function prepareWebUi() {
    if (isSetupNeeded()) {
        console.log('Setting up Task Manager web UI (first run, this may take a minute)...');
        fs.mkdirSync(WEB_UI_CACHE_DIR, { recursive: true });
        (0, child_process_1.execSync)(`cp -r "${RESOURCES_WEB_DIR}/." "${WEB_UI_CACHE_DIR}/"`, { stdio: 'inherit' });
        (0, child_process_1.execSync)('npm install', { cwd: WEB_UI_CACHE_DIR, stdio: 'inherit' });
        fs.writeFileSync(VERSION_FILE, getCurrentVersion());
    }
    if (!fs.existsSync(path.join(WEB_UI_CACHE_DIR, '.next'))) {
        console.log('Building web UI...');
        (0, child_process_1.execSync)('npm run build', { cwd: WEB_UI_CACHE_DIR, stdio: 'inherit' });
    }
}
function buildEnv(port) {
    const env = { ...process.env, PORT: port };
    const mcpJsonPath = path.resolve('.skiv/mcp.json');
    if (fs.existsSync(mcpJsonPath)) {
        try {
            const mcp = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8'));
            const dbPath = mcp.mcpServers?.task_manager?.env?.TASK_DB_PATH;
            if (dbPath)
                env.TASK_DB_PATH = dbPath;
        }
        catch { /* ignore */ }
    }
    return env;
}
function spawnWebUi(port = '3000') {
    const env = buildEnv(port);
    return (0, child_process_1.spawn)('npm', ['run', 'start'], {
        cwd: WEB_UI_CACHE_DIR,
        stdio: 'pipe',
        env,
    });
}
async function web() {
    prepareWebUi();
    const port = process.env.PORT ?? '3000';
    console.log(`\nTask Manager UI: http://localhost:${port}`);
    const proc = (0, child_process_1.spawn)('npm', ['run', 'start'], {
        cwd: WEB_UI_CACHE_DIR,
        stdio: 'inherit',
        env: buildEnv(port),
    });
    await new Promise((resolve, reject) => {
        proc.on('error', reject);
        proc.on('close', (code) => {
            if (code !== 0 && code !== null)
                reject(new Error(`Process exited with code ${code}`));
            else
                resolve();
        });
    });
}
