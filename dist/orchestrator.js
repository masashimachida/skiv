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
const logger_1 = require("./logger");
const mcp_1 = require("./mcp");
const worktree_1 = require("./worktree");
async function startOrchestrator() {
    const config = JSON.parse((0, fs_1.readFileSync)(path.resolve('skiv.config.json'), 'utf-8'));
    const pollingInterval = (config.pollingInterval ?? 10) * 1000;
    logger_1.log.info(`orchestrator starting (polling every ${config.pollingInterval ?? 10}s, agents: ${config.agents.map((a) => a.name).join(', ')})`);
    const client = await (0, mcp_1.connectToTaskManager)();
    logger_1.log.info('connected to task_manager');
    const runningAgents = new Set();
    async function processAgents() {
        for (const agent of config.agents) {
            if (runningAgents.has(agent.name))
                continue;
            const roleConfig = config.roles[agent.role];
            if (!roleConfig) {
                logger_1.log.warn(`agent "${agent.name}" skipped: role "${agent.role}" not defined in config`);
                continue;
            }
            const pickFrom = roleConfig.pickFrom ?? 'inbox';
            const task = await (0, mcp_1.getNextTask)(client, pickFrom);
            if (!task)
                continue;
            logger_1.log.info(`[${agent.name}] task found: "${task.title}" (id=${task.id}, status=${pickFrom})`);
            let wPath;
            try {
                wPath = await (0, worktree_1.createWorktree)(task.id);
                logger_1.log.info(`[${agent.name}] worktree created: ${wPath}`);
            }
            catch (err) {
                logger_1.log.error(`[${agent.name}] failed to create worktree for task ${task.id}`, err);
                continue;
            }
            logger_1.log.info(`[${agent.name}] spawning agent...`);
            runningAgents.add(agent.name);
            (0, agent_1.spawnAgent)(agent, roleConfig, agent.role, wPath)
                .then(async () => {
                const finalTask = await (0, mcp_1.getTaskById)(client, task.id);
                logger_1.log.info(`[${agent.name}] finished task "${task.title}" → status=${finalTask?.status ?? 'unknown'}`);
                const committed = await (0, worktree_1.hasCommits)(task.id);
                if (!committed) {
                    logger_1.log.warn(`[${agent.name}] no commits found on feature/${task.id} — agent may have skipped git commit`);
                }
                if (finalTask?.status === 'done') {
                    if (committed) {
                        await (0, worktree_1.mergeFeatureBranch)(client, task.id);
                    }
                    else {
                        logger_1.log.warn(`[${agent.name}] skipping merge: no commits on feature/${task.id}`);
                    }
                }
            })
                .catch((err) => logger_1.log.error(`[${agent.name}] unexpected error`, err))
                .finally(async () => {
                await (0, worktree_1.removeWorktree)(task.id);
                logger_1.log.info(`[${agent.name}] worktree removed`);
                runningAgents.delete(agent.name);
            });
        }
    }
    process.on('SIGINT', () => {
        logger_1.log.info('orchestrator stopped');
        process.exit(0);
    });
    // eslint-disable-next-line no-constant-condition
    while (true) {
        await processAgents();
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
    }
}
