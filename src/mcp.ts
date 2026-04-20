import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync } from 'fs';
import * as path from 'path';
import { McpServerConfig, Task } from './types';

export async function connectToTaskManager(): Promise<Client> {
  const mcpJson = JSON.parse(readFileSync(path.resolve('.skiv/mcp.json'), 'utf-8'));
  const serverConfig: McpServerConfig = mcpJson.mcpServers.task_manager;
  const transport = new StdioClientTransport({
    command: serverConfig.command,
    args: serverConfig.args,
    env: { ...process.env, ...serverConfig.env } as Record<string, string>,
  });
  const client = new Client({ name: 'skiv-orchestrator', version: '0.1.0' });
  await client.connect(transport);
  return client;
}

export async function callTool<T>(client: Client, name: string, args: Record<string, unknown>): Promise<T> {
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '[]';
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed as T;
  if (parsed && typeof parsed === 'object') {
    const arrayValue = Object.values(parsed).find((v) => Array.isArray(v));
    if (arrayValue) return arrayValue as T;
  }
  return parsed as T;
}

export async function getNextTask(client: Client, pickFrom: string): Promise<Task | null> {
  const tasks = await callTool<Task[]>(client, 'list_tasks', { status: pickFrom });
  return tasks.find((t) => !t.assignee) ?? null;
}

export async function getTaskById(client: Client, taskId: string): Promise<Task | null> {
  try {
    const result = await client.callTool({ name: 'get_task', arguments: { id: taskId } });
    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}';
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return null;
    if ((parsed as Task).id) return parsed as Task;
    for (const value of Object.values(parsed)) {
      if (value && typeof value === 'object' && (value as Task).id) return value as Task;
    }
    return null;
  } catch {
    return null;
  }
}
