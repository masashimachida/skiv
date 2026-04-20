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
const logger_1 = require("./logger");
function buildAgentPrompt(roleName, roleConfig, worktreePath) {
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

## 作業ディレクトリ
あなたの作業ディレクトリは **${worktreePath}** です。
- このディレクトリは専用の git worktree です（メインブランチとは分離されています）
- ファイルの読み書きは必ずこのディレクトリ内で行ってください
- 絶対パスを使う場合も必ず ${worktreePath} 以下のパスを使用してください
- git のブランチ切り替え（checkout）は行わないでください

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
5. 作業を実施する
   - カレントディレクトリは専用の git worktree です
6. **変更を必ず git コミットする**（ファイルを変更した場合は必須）:
   \`\`\`
   git add -A
   git commit -m "作業内容を簡潔に記述"
   \`\`\`
   - コミットしないと変更が失われるため、必ず実行すること
7. 作業完了後:
   - mcp__task_manager__add_comment で結果を記録する（author="${roleName}"）
   - mcp__task_manager__update_task で status を更新し、assignee を null にクリアする（次のエージェントが拾えるようにする）:
${outcomesText}

## 注意
- 1回の起動で1タスクだけ処理してください
- ファイルを変更したら必ずコミットしてから終了してください
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
    const prompt = buildAgentPrompt(roleName, roleConfig, cwd);
    const { cmd, args } = buildCommand(agent.tool, roleConfig.model, agent.allowedTools);
    return new Promise((resolve) => {
        const proc = (0, child_process_1.spawn)(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
        proc.stdout.on('data', (data) => logger_1.log.agent(agent.name, data.toString()));
        proc.stderr.on('data', (data) => logger_1.log.agent(agent.name, data.toString()));
        proc.stdin.write(prompt);
        proc.stdin.end();
        proc.on('close', (code) => {
            logger_1.log.info(`[${agent.name}] process exited (code=${code})`);
            resolve();
        });
    });
}
