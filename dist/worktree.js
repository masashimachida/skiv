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
exports.createWorktree = createWorktree;
exports.removeWorktree = removeWorktree;
exports.mergeFeatureBranch = mergeFeatureBranch;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const util_1 = require("util");
const mcp_1 = require("./mcp");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
function worktreePath(taskId) {
    return path.resolve(`.skiv/worktrees/${taskId}`);
}
async function createWorktree(taskId) {
    const wPath = worktreePath(taskId);
    const branch = `feature/${taskId}`;
    const branchExists = await execAsync(`git rev-parse --verify "${branch}"`)
        .then(() => true)
        .catch(() => false);
    if (branchExists) {
        await execAsync(`git worktree add "${wPath}" "${branch}"`);
    }
    else {
        await execAsync(`git worktree add -b "${branch}" "${wPath}"`);
    }
    return wPath;
}
async function removeWorktree(taskId) {
    const wPath = worktreePath(taskId);
    await execAsync(`git worktree remove "${wPath}" --force`).catch(() => { });
}
async function mergeFeatureBranch(client, taskId) {
    const branch = `feature/${taskId}`;
    try {
        await execAsync(`git merge "${branch}" --no-ff -m "Merge ${branch}"`);
        console.log(`[merge] ${branch} merged successfully`);
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[merge] failed to merge ${branch}:`, errorMsg);
        await execAsync('git merge --abort').catch(() => { });
        await (0, mcp_1.callTool)(client, 'add_comment', {
            taskId,
            author: 'orchestrator',
            body: `マージに失敗しました。手動で解決してください。\n\`\`\`\n${errorMsg}\n\`\`\``,
        });
        await (0, mcp_1.callTool)(client, 'update_task', { id: taskId, status: 'pending', assignee: null });
    }
}
