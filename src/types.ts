export interface AgentConfig {
  name: string;
  tool: 'claude' | 'codex' | 'junie';
  role: string;
  allowedTools?: string[];
}

export interface RoleConfig {
  prompt: string;
  model?: string;
  pickFrom?: string;
  claimStatus?: string;
  outcomes?: Record<string, string>;
  defaultOutcome?: string;
  maxRetries?: number;
}

export interface SkivConfig {
  agents: AgentConfig[];
  roles: Record<string, RoleConfig>;
  pollingInterval?: number;
}

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  assignee?: string;
}
