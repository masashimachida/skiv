import { readFileSync } from 'fs';
import * as path from 'path';
import { spawnAgent } from './agent';
import { log } from './logger';
import { connectToTaskManager, getNextTask, getTaskById } from './mcp';
import { SkivConfig } from './types';
import { createWorktree, hasCommits, mergeFeatureBranch, removeWorktree } from './worktree';

export async function startOrchestrator(): Promise<void> {
  const config: SkivConfig = JSON.parse(readFileSync(path.resolve('skiv.config.json'), 'utf-8'));
  const pollingInterval = (config.pollingInterval ?? 10) * 1000;

  log.info(`orchestrator starting (polling every ${config.pollingInterval ?? 10}s, agents: ${config.agents.map((a) => a.name).join(', ')})`);
  const client = await connectToTaskManager();
  log.info('connected to task_manager');

  const runningAgents = new Set<string>();

  async function processAgents() {
    for (const agent of config.agents) {
      if (runningAgents.has(agent.name)) continue;

      const roleConfig = config.roles[agent.role];
      if (!roleConfig) {
        log.warn(`agent "${agent.name}" skipped: role "${agent.role}" not defined in config`);
        continue;
      }

      const pickFrom = roleConfig.pickFrom ?? 'inbox';
      const task = await getNextTask(client, pickFrom);
      if (!task) continue;

      log.info(`[${agent.name}] task found: "${task.title}" (id=${task.id}, status=${pickFrom})`);

      let wPath: string;
      try {
        wPath = await createWorktree(task.id);
        log.info(`[${agent.name}] worktree created: ${wPath}`);
      } catch (err) {
        log.error(`[${agent.name}] failed to create worktree for task ${task.id}`, err);
        continue;
      }

      log.info(`[${agent.name}] spawning agent...`);
      runningAgents.add(agent.name);

      spawnAgent(agent, roleConfig, agent.role, wPath)
        .then(async () => {
          const finalTask = await getTaskById(client, task.id);
          log.info(`[${agent.name}] finished task "${task.title}" → status=${finalTask?.status ?? 'unknown'}`);
          const committed = await hasCommits(task.id);
          if (!committed) {
            log.warn(`[${agent.name}] no commits found on feature/${task.id} — agent may have skipped git commit`);
          }
          if (finalTask?.status === 'done') {
            if (committed) {
              await mergeFeatureBranch(client, task.id);
            } else {
              log.warn(`[${agent.name}] skipping merge: no commits on feature/${task.id}`);
            }
          }
        })
        .catch((err) => log.error(`[${agent.name}] unexpected error`, err))
        .finally(async () => {
          await removeWorktree(task.id);
          log.info(`[${agent.name}] worktree removed`);
          runningAgents.delete(agent.name);
        });
    }
  }

  process.on('SIGINT', () => {
    log.info('orchestrator stopped');
    process.exit(0);
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await processAgents();
    await new Promise((resolve) => setTimeout(resolve, pollingInterval));
  }
}
