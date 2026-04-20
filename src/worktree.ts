import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';
import { log } from './logger';
import { callTool } from './mcp';

const execAsync = promisify(exec);

function worktreePath(taskId: string): string {
  return path.resolve(`.skiv/worktrees/${taskId}`);
}

export async function createWorktree(taskId: string): Promise<string> {
  const wPath = worktreePath(taskId);
  const branch = `feature/${taskId}`;
  const branchExists = await execAsync(`git rev-parse --verify "${branch}"`)
    .then(() => true)
    .catch(() => false);

  if (branchExists) {
    log.info(`worktree: branch "${branch}" already exists, reusing`);
    await execAsync(`git worktree add "${wPath}" "${branch}"`);
  } else {
    log.info(`worktree: creating branch "${branch}"`);
    await execAsync(`git worktree add -b "${branch}" "${wPath}"`);
  }
  return wPath;
}

export async function removeWorktree(taskId: string): Promise<void> {
  const wPath = worktreePath(taskId);
  await execAsync(`git worktree remove "${wPath}" --force`).catch(() => {});
}

export async function hasCommits(taskId: string): Promise<boolean> {
  const branch = `feature/${taskId}`;
  try {
    const { stdout } = await execAsync(`git rev-list --count main..${branch} 2>/dev/null || git rev-list --count HEAD..${branch}`);
    return parseInt(stdout.trim(), 10) > 0;
  } catch {
    return false;
  }
}

export async function mergeFeatureBranch(client: Client, taskId: string): Promise<void> {
  const branch = `feature/${taskId}`;
  log.info(`merge: attempting to merge "${branch}" into current branch`);
  try {
    await execAsync(`git merge "${branch}" --no-ff -m "Merge ${branch}"`);
    log.info(`merge: "${branch}" merged successfully`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    log.error(`merge: failed to merge "${branch}"`, errorMsg);
    await execAsync('git merge --abort').catch(() => {});
    await callTool(client, 'add_comment', {
      taskId,
      author: 'orchestrator',
      body: `マージに失敗しました。手動で解決してください。\n\`\`\`\n${errorMsg}\n\`\`\``,
    });
    await callTool(client, 'update_task', { id: taskId, status: 'pending', assignee: null });
    log.warn(`merge: task ${taskId} set to "pending"`);
  }
}
