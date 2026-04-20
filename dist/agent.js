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
exports.buildAgentPrompt = buildAgentPrompt;
exports.spawnAgent = spawnAgent;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
function buildAgentPrompt(roleName, roleConfig) {
    const pickFrom = roleConfig.pickFrom ?? 'inbox';
    const defaultOutcome = roleConfig.defaultOutcome ?? 'done';
    const outcomesText = roleConfig.outcomes
        ? Object.entries(roleConfig.outcomes)
            .map(([keyword, status]) => `  - "${keyword}" → status を "${status}" に更新`)
            .join('\n')
        : `  - デフォルト: status を "${defaultOutcome}" に更新`;
    const maxRetriesText = roleConfig.maxRetries
        ? `\n- このロールの最大リトライ回数は ${roleConfig.maxRetries} 回です。自分のコメント数がこれを超えているタスクはスキップしてください。`
        : '';
    return `あなたは "${roleName}" ロールのエージェントです。

## あなたの役割
${roleConfig.prompt}

## 作業手順
以下の手順で作業してください。着手できるタスクがなければ何もせず終了してください。

1. mcp__task_manager__list_tasks で status="${pickFrom}" のタスクを取得する
2. 着手可能なタスクを1つ選ぶ
   - assignee が空（未割り当て）のタスクのみ対象にする
   - dependencies がある場合、すべての依存タスクが status="done" であることを確認する${maxRetriesText}
3. mcp__task_manager__update_task で以下を **1回のAPIコールで同時に** 更新する（競合防止のため最初に実行）:
   - assignee: "${roleName}"${roleConfig.claimStatus ? `\n   - status: "${roleConfig.claimStatus}"` : ''}
4. mcp__task_manager__get_task と mcp__task_manager__list_comments でタスクの詳細とコメント履歴を取得する
   - コメント履歴には前回の作業結果やレビュー指摘が含まれている場合があるので必ず参照する
5. 作業を実施する（カレントディレクトリは作業用 git worktree です。変更は必ずコミットしてください）
6. 作業完了後:
   - mcp__task_manager__add_comment で結果を記録する（author="${roleName}"）
   - mcp__task_manager__update_task で status を更新し、assignee を null にクリアする（次のエージェントが拾えるようにする）:
${outcomesText}

## 注意
- 1回の起動で1タスクだけ処理してください
- タスクの処理が終わったら終了してください
`;
}
function buildCommand(tool, model, allowedTools) {
    switch (tool) {
        case 'claude': {
            const toolsArg = allowedTools?.length
                ? ['--allowedTools', allowedTools.join(',')]
                : ['--dangerously-skip-permissions'];
            const mcpConfigPath = path.resolve('.skiv/mcp.json');
            return {
                cmd: 'claude',
                args: ['--print', '--mcp-config', mcpConfigPath, ...toolsArg, ...(model ? ['--model', model] : [])],
            };
        }
        case 'codex':
            return { cmd: 'codex', args: [] };
        case 'junie':
            return { cmd: 'junie', args: [] };
        default:
            throw new Error(`Unknown tool: ${tool}`);
    }
}
function spawnAgent(agent, roleConfig, roleName, cwd) {
    const prompt = buildAgentPrompt(roleName, roleConfig);
    const { cmd, args } = buildCommand(agent.tool, roleConfig.model, agent.allowedTools);
    return new Promise((resolve) => {
        const proc = (0, child_process_1.spawn)(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
        proc.stdout.on('data', (data) => process.stdout.write(`[${agent.name}] ${data}`));
        proc.stderr.on('data', (data) => process.stderr.write(`[${agent.name}] ${data}`));
        proc.stdin.write(prompt);
        proc.stdin.end();
        proc.on('close', (code) => {
            console.log(`[${agent.name}] exited (code=${code})`);
            resolve();
        });
    });
}
