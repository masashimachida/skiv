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
exports.startOrchestrator = startOrchestrator;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const agent_1 = require("./agent");
const mcp_1 = require("./mcp");
const worktree_1 = require("./worktree");
async function startOrchestrator() {
    const config = JSON.parse((0, fs_1.readFileSync)(path.resolve('skiv.config.json'), 'utf-8'));
    const pollingInterval = (config.pollingInterval ?? 10) * 1000;
    console.log('skiv orchestrator started. Press Ctrl+C to stop.');
    const client = await (0, mcp_1.connectToTaskManager)();
    const runningAgents = new Set();
    async function processAgents() {
        for (const agent of config.agents) {
            if (runningAgents.has(agent.name))
                continue;
            const roleConfig = config.roles[agent.role];
            if (!roleConfig) {
                console.log(`[skip] role "${agent.role}" not defined in config`);
                continue;
            }
            const pickFrom = roleConfig.pickFrom ?? 'inbox';
            const task = await (0, mcp_1.getNextTask)(client, pickFrom);
            if (!task)
                continue;
            let wPath;
            try {
                wPath = await (0, worktree_1.createWorktree)(task.id);
            }
            catch (err) {
                console.error(`[${agent.name}] failed to create worktree for task ${task.id}:`, err);
                continue;
            }
            console.log(`[${agent.name}] spawning for task ${task.id} in ${wPath}`);
            runningAgents.add(agent.name);
            (0, agent_1.spawnAgent)(agent, roleConfig, agent.role, wPath)
                .then(async () => {
                const finalTask = await (0, mcp_1.getTaskById)(client, task.id);
                if (finalTask?.status === 'done') {
                    await (0, worktree_1.mergeFeatureBranch)(client, task.id);
                }
            })
                .catch((err) => console.error(`[${agent.name}] error:`, err))
                .finally(async () => {
                await (0, worktree_1.removeWorktree)(task.id);
                runningAgents.delete(agent.name);
            });
        }
    }
    process.on('SIGINT', () => {
        console.log('\nskiv orchestrator stopped.');
        process.exit(0);
    });
    // eslint-disable-next-line no-constant-condition
    while (true) {
        await processAgents();
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
    }
}
