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
exports.init = init;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');
function copyTemplate(src, dest) {
    if ((0, fs_1.existsSync)(dest)) {
        console.log(`  skip: ${dest} (already exists)`);
        return;
    }
    const content = (0, fs_1.readFileSync)(path.join(TEMPLATES_DIR, src), 'utf-8');
    (0, fs_1.writeFileSync)(dest, content);
    console.log(`  create: ${dest}`);
}
async function init() {
    console.log('Initializing skiv...');
    const skivDir = path.resolve('.skiv');
    if (!(0, fs_1.existsSync)(skivDir)) {
        (0, fs_1.mkdirSync)(skivDir);
        console.log('  create: .skiv/');
    }
    copyTemplate('skiv.config.json', path.resolve('skiv.config.json'));
    const mcpJsonPath = path.resolve('.skiv/mcp.json');
    if ((0, fs_1.existsSync)(mcpJsonPath)) {
        console.log(`  skip: .skiv/mcp.json (already exists)`);
    }
    else {
        const serverPath = path.join(__dirname, '..', 'task-manager-server.js');
        const projectId = path.basename(process.cwd());
        const mcpConfig = {
            mcpServers: {
                task_manager: {
                    command: 'node',
                    args: [serverPath],
                    env: { TASK_PROJECT_ID: projectId }
                }
            }
        };
        (0, fs_1.writeFileSync)(mcpJsonPath, JSON.stringify(mcpConfig, null, 2));
        console.log('  create: .skiv/mcp.json');
    }
    copyTemplate('skiv/CLAUDE.md', path.resolve('.skiv/CLAUDE.md'));
    const claudeMdPath = path.resolve('CLAUDE.md');
    const importLine = '@.skiv/CLAUDE.md';
    if ((0, fs_1.existsSync)(claudeMdPath)) {
        const content = (0, fs_1.readFileSync)(claudeMdPath, 'utf-8');
        if (!content.includes(importLine)) {
            (0, fs_1.writeFileSync)(claudeMdPath, `${importLine}\n\n${content}`);
            console.log('  update: CLAUDE.md (added @.skiv/CLAUDE.md import)');
        }
        else {
            console.log('  skip: CLAUDE.md (import already present)');
        }
    }
    else {
        (0, fs_1.writeFileSync)(claudeMdPath, `${importLine}\n`);
        console.log('  create: CLAUDE.md');
    }
    console.log('\nskiv initialized! Next steps:');
    console.log('  1. Edit skiv.config.json to configure your agents and roles');
    console.log('  2. Run: skiv run');
}
